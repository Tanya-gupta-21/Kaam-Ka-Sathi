"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Stats = {
  users: number;
  admins: number;
  items: number;
  needs: number;
  interests: number;
  helpOffers: number;
};

type RecentRecord = {
  id: number;
  title: string;
  category: string | null;
  city: string | null;
  created_at: string;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    users: 0,
    admins: 0,
    items: 0,
    needs: 0,
    interests: 0,
    helpOffers: 0,
  });

  const [recentItems, setRecentItems] = useState<RecentRecord[]>([]);
  const [recentNeeds, setRecentNeeds] = useState<RecentRecord[]>([]);

  async function checkAdminAndLoadData() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      // Check admin role
      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

      if (profileError) {
        console.error("Profile error:", profileError);
        router.replace("/dashboard");
        return;
      }

      if (profile?.role !== "admin") {
        router.replace("/dashboard");
        return;
      }

      // -------------------------
      // USERS
      // -------------------------

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, role");

      const totalUsers = profiles?.length || 0;

      const totalAdmins =
        profiles?.filter(
          (profile) => profile.role === "admin"
        ).length || 0;

      // -------------------------
      // ITEMS
      // -------------------------

      const { count: itemsCount } = await supabase
        .from("items")
        .select("*", {
          count: "exact",
          head: true,
        });

      // -------------------------
      // NEEDS
      // -------------------------

      const { count: needsCount } = await supabase
        .from("needs")
        .select("*", {
          count: "exact",
          head: true,
        });

      // -------------------------
      // ITEM INTERESTS
      // -------------------------

      const { count: interestsCount } = await supabase
        .from("interests")
        .select("*", {
          count: "exact",
          head: true,
        });

      // -------------------------
      // HELP OFFERS
      // -------------------------

      const { count: helpOffersCount } =
        await supabase
          .from("need_interests")
          .select("*", {
            count: "exact",
            head: true,
          });

      setStats({
        users: totalUsers,
        admins: totalAdmins,
        items: itemsCount || 0,
        needs: needsCount || 0,
        interests: interestsCount || 0,
        helpOffers: helpOffersCount || 0,
      });

      // -------------------------
      // RECENT ITEMS
      // -------------------------

      const { data: items } = await supabase
        .from("items")
        .select(
          "id, title, category, city, created_at"
        )
        .order("created_at", {
          ascending: false,
        })
        .limit(5);

      setRecentItems(items || []);

      // -------------------------
      // RECENT NEEDS
      // -------------------------

      const { data: needs } = await supabase
        .from("needs")
        .select(
          "id, title, category, city, created_at"
        )
        .order("created_at", {
          ascending: false,
        })
        .limit(5);

      setRecentNeeds(needs || []);
    } catch (error) {
      console.error(
        "Admin dashboard error:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void checkAdminAndLoadData(), 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLogout() {
    supabase.auth.signOut().then(() => {
      router.replace("/login");
      router.refresh();
    });
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f4]">
        <div className="text-center">

          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-gray-200 border-t-[#173d29]" />

          <p className="mt-5 font-semibold text-gray-500">
            Loading admin dashboard...
          </p>

        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8f4] text-[#173d29]">

      <div className="flex min-h-screen">

        {/* ================= SIDEBAR ================= */}

        <aside className="hidden w-72 shrink-0 bg-[#173d29] text-white lg:flex lg:flex-col">

          {/* Logo */}

          <div className="border-b border-white/10 px-7 py-7">

            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-2xl">
                ♻️
              </div>

              <div>
                <h1 className="text-lg font-black">
                  Kaam Ka Sathi
                </h1>

                <p className="text-xs text-green-200">
                  Admin Panel
                </p>
              </div>

            </div>

          </div>

          {/* Navigation */}

          <nav className="flex-1 space-y-2 px-4 py-6">

            {/* Dashboard */}

            <button
              className="flex w-full items-center gap-3 rounded-2xl bg-white/10 px-4 py-3.5 text-left font-bold"
            >
              <span>📊</span>
              Dashboard
            </button>

            {/* Users */}

            <button
              onClick={() =>
                router.push("/admin/users")
              }
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left font-semibold text-green-100 transition hover:bg-white/10 hover:text-white"
            >
              <span>👥</span>
              Users
            </button>

            {/* Items */}

            <button
              onClick={() =>
                router.push("/admin/items")
              }
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left font-semibold text-green-100 transition hover:bg-white/10 hover:text-white"
            >
              <span>📦</span>
              Items
            </button>

            {/* Needs */}

            <button
              onClick={() =>
                router.push("/admin/needs")
              }
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left font-semibold text-green-100 transition hover:bg-white/10 hover:text-white"
            >
              <span>🙋</span>
              Community Needs
            </button>

            {/* Interests */}

            <button
              onClick={() =>
                router.push("/admin/interests")
              }
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left font-semibold text-green-100 transition hover:bg-white/10 hover:text-white"
            >
              <span>❤️</span>
              Interests
            </button>

            {/* User Dashboard */}

            <button
              onClick={() =>
                router.push("/dashboard")
              }
              className="mt-5 flex w-full items-center gap-3 rounded-2xl border border-white/10 px-4 py-3.5 text-left font-semibold text-green-100 transition hover:bg-white/10 hover:text-white"
            >
              <span>👤</span>
              User Dashboard
            </button>

          </nav>

          {/* Admin info */}

          <div className="border-t border-white/10 p-4">

            <div className="mb-3 rounded-2xl bg-white/10 p-4">

              <p className="text-xs text-green-200">
                Logged in as
              </p>

              <p className="mt-1 font-bold">
                Administrator
              </p>

              <span className="mt-2 inline-block rounded-full bg-[#c63868] px-3 py-1 text-xs font-bold">
                ADMIN
              </span>

            </div>

            {/* Logout */}

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-semibold text-red-200 transition hover:bg-red-500/10"
            >
              <span>↪</span>
              Logout
            </button>

          </div>

        </aside>

        {/* ================= MAIN ================= */}

        <section className="min-w-0 flex-1">

          {/* HEADER */}

          <header className="border-b border-black/5 bg-[#f7f8f4] px-5 py-6 md:px-8">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>

                <p className="text-xs font-black tracking-[0.18em] text-[#c63868]">
                  ADMIN PANEL
                </p>

                <h2 className="mt-1 text-3xl font-black md:text-4xl">
                  Admin Dashboard
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Manage users, items, needs and
                  community activity.
                </p>

              </div>

              <button
                onClick={() =>
                  router.push("/dashboard")
                }
                className="w-fit rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
              >
                View User Dashboard →
              </button>

            </div>

          </header>

          <div className="p-5 md:p-8">

            {/* ================= STATS ================= */}

            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">

              {/* Users */}

              <button
                onClick={() =>
                  router.push("/admin/users")
                }
                className="group rounded-3xl bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >

                <div className="flex items-center justify-between">

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-2xl">
                    👥
                  </div>

                  <span className="text-xl transition group-hover:translate-x-1">
                    →
                  </span>

                </div>

                <p className="mt-5 text-sm font-semibold text-gray-500">
                  Total Users
                </p>

                <p className="mt-1 text-4xl font-black">
                  {stats.users}
                </p>

              </button>

              {/* Admins */}

              <button
                onClick={() =>
                  router.push("/admin/users")
                }
                className="group rounded-3xl bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >

                <div className="flex items-center justify-between">

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100 text-2xl">
                    🛡️
                  </div>

                  <span className="text-xl transition group-hover:translate-x-1">
                    →
                  </span>

                </div>

                <p className="mt-5 text-sm font-semibold text-gray-500">
                  Total Admins
                </p>

                <p className="mt-1 text-4xl font-black text-[#c63868]">
                  {stats.admins}
                </p>

              </button>

              {/* Items */}

              <button
                onClick={() =>
                  router.push("/admin/items")
                }
                className="group rounded-3xl bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >

                <div className="flex items-center justify-between">

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-2xl">
                    📦
                  </div>

                  <span className="text-xl transition group-hover:translate-x-1">
                    →
                  </span>

                </div>

                <p className="mt-5 text-sm font-semibold text-gray-500">
                  Total Items
                </p>

                <p className="mt-1 text-4xl font-black">
                  {stats.items}
                </p>

              </button>

              {/* Needs */}

              <button
                onClick={() =>
                  router.push("/admin/needs")
                }
                className="group rounded-3xl bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >

                <div className="flex items-center justify-between">

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100 text-2xl">
                    🙋
                  </div>

                  <span className="text-xl transition group-hover:translate-x-1">
                    →
                  </span>

                </div>

                <p className="mt-5 text-sm font-semibold text-gray-500">
                  Community Needs
                </p>

                <p className="mt-1 text-4xl font-black text-[#c63868]">
                  {stats.needs}
                </p>

              </button>

              {/* Interests */}

              <button
                onClick={() =>
                  router.push("/admin/interests")
                }
                className="group rounded-3xl bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >

                <div className="flex items-center justify-between">

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-2xl">
                    ❤️
                  </div>

                  <span className="text-xl transition group-hover:translate-x-1">
                    →
                  </span>

                </div>

                <p className="mt-5 text-sm font-semibold text-gray-500">
                  Item Interests
                </p>

                <p className="mt-1 text-4xl font-black">
                  {stats.interests}
                </p>

              </button>

              {/* Help Offers */}

              <button
                onClick={() =>
                  router.push("/admin/interests")
                }
                className="group rounded-3xl bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >

                <div className="flex items-center justify-between">

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100 text-2xl">
                    🤝
                  </div>

                  <span className="text-xl transition group-hover:translate-x-1">
                    →
                  </span>

                </div>

                <p className="mt-5 text-sm font-semibold text-gray-500">
                  Help Offers
                </p>

                <p className="mt-1 text-4xl font-black text-[#c63868]">
                  {stats.helpOffers}
                </p>

              </button>

            </section>

            {/* ================= QUICK ACTIONS ================= */}

            <section className="mt-8">

              <h3 className="text-xl font-black">
                Quick Actions
              </h3>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                <button
                  onClick={() =>
                    router.push("/admin/users")
                  }
                  className="rounded-2xl border border-gray-200 bg-white p-5 text-left transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="text-2xl">
                    👥
                  </div>

                  <p className="mt-3 font-black">
                    Manage Users
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    View and manage user roles.
                  </p>
                </button>

                <button
                  onClick={() =>
                    router.push("/admin/items")
                  }
                  className="rounded-2xl border border-gray-200 bg-white p-5 text-left transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="text-2xl">
                    📦
                  </div>

                  <p className="mt-3 font-black">
                    Manage Items
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Review listed community items.
                  </p>
                </button>

                <button
                  onClick={() =>
                    router.push("/admin/needs")
                  }
                  className="rounded-2xl border border-gray-200 bg-white p-5 text-left transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="text-2xl">
                    🙋
                  </div>

                  <p className="mt-3 font-black">
                    Manage Needs
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Review community requirements.
                  </p>
                </button>

                <button
                  onClick={() =>
                    router.push("/admin/interests")
                  }
                  className="rounded-2xl border border-gray-200 bg-white p-5 text-left transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="text-2xl">
                    ❤️
                  </div>

                  <p className="mt-3 font-black">
                    View Activity
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Monitor interests and help offers.
                  </p>
                </button>

              </div>

            </section>

            {/* ================= RECENT ACTIVITY ================= */}

            <section className="mt-8 grid gap-6 xl:grid-cols-2">

              {/* Recent Items */}

              <div className="overflow-hidden rounded-3xl bg-white shadow-sm">

                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">

                  <div>

                    <h3 className="text-xl font-black">
                      Recent Items
                    </h3>

                    <p className="mt-1 text-xs text-gray-500">
                      Latest items added by users.
                    </p>

                  </div>

                  <button
                    onClick={() =>
                      router.push("/admin/items")
                    }
                    className="text-sm font-bold text-[#c63868] hover:underline"
                  >
                    View all
                  </button>

                </div>

                <div className="divide-y divide-gray-100">

                  {recentItems.length > 0 ? (
                    recentItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-4 px-6 py-4"
                      >

                        <div className="min-w-0">

                          <p className="truncate font-bold">
                            {item.title}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {item.category ||
                              "Uncategorized"}
                            {item.city
                              ? ` • ${item.city}`
                              : ""}
                          </p>

                        </div>

                        <span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-[#173d29]">
                          Item
                        </span>

                      </div>
                    ))
                  ) : (
                    <div className="px-6 py-10 text-center text-sm text-gray-500">
                      No items available.
                    </div>
                  )}

                </div>

              </div>

              {/* Recent Needs */}

              <div className="overflow-hidden rounded-3xl bg-white shadow-sm">

                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">

                  <div>

                    <h3 className="text-xl font-black">
                      Recent Community Needs
                    </h3>

                    <p className="mt-1 text-xs text-gray-500">
                      Latest requirements posted by users.
                    </p>

                  </div>

                  <button
                    onClick={() =>
                      router.push("/admin/needs")
                    }
                    className="text-sm font-bold text-[#c63868] hover:underline"
                  >
                    View all
                  </button>

                </div>

                <div className="divide-y divide-gray-100">

                  {recentNeeds.length > 0 ? (
                    recentNeeds.map((need) => (
                      <div
                        key={need.id}
                        className="flex items-center justify-between gap-4 px-6 py-4"
                      >

                        <div className="min-w-0">

                          <p className="truncate font-bold">
                            {need.title}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {need.category ||
                              "Uncategorized"}
                            {need.city
                              ? ` • ${need.city}`
                              : ""}
                          </p>

                        </div>

                        <span className="shrink-0 rounded-full bg-pink-100 px-3 py-1 text-xs font-bold text-[#c63868]">
                          Need
                        </span>

                      </div>
                    ))
                  ) : (
                    <div className="px-6 py-10 text-center text-sm text-gray-500">
                      No community needs available.
                    </div>
                  )}

                </div>

              </div>

            </section>

            {/* ================= FOOTER ================= */}

            <div className="mt-8 rounded-3xl bg-[#173d29] p-6 text-white">

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                <div>

                  <p className="font-black">
                    Kaam Ka Sathi Admin Panel
                  </p>

                  <p className="mt-1 text-sm text-green-200">
                    Keep the community safe, useful and
                    well-managed.
                  </p>

                </div>

                <div className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold">
                  Admin Access
                </div>

              </div>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}
