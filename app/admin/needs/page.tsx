"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Need = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  city: string;
  locality: string;
  created_at: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
};

const categories = [
  "All",
  "Books",
  "Clothes",
  "Bags",
  "Furniture",
  "Toys",
  "Electronics",
  "Stationery",
  "Household",
];

export default function AdminNeedsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadNeeds() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: adminProfile, error: adminError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (adminError || adminProfile?.role !== "admin") {
        router.replace("/dashboard");
        return;
      }

      const { data: needsData, error: needsError } = await supabase
        .from("needs")
        .select(
          "id, user_id, title, description, category, city, locality, created_at"
        )
        .order("created_at", { ascending: false });

      if (needsError) {
        console.error("Needs error:", needsError);
        return;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email");

      if (profilesError) {
        console.error("Profiles error:", profilesError);
      }

      setNeeds(needsData || []);
      setProfiles(profilesData || []);
    } catch (error) {
      console.error("Admin needs error:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadNeeds(), 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getUser(userId: string) {
    return profiles.find((profile) => profile.id === userId);
  }

  async function deleteNeed(need: Need) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${need.title}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(need.id);

      const { error } = await supabase
        .from("needs")
        .delete()
        .eq("id", need.id);

      if (error) {
        console.error("Delete need error:", error);
        alert(error.message);
        return;
      }

      setNeeds((currentNeeds) =>
        currentNeeds.filter((currentNeed) => currentNeed.id !== need.id)
      );
    } finally {
      setDeletingId(null);
    }
  }

  function handleLogout() {
    supabase.auth.signOut().then(() => {
      router.replace("/login");
      router.refresh();
    });
  }

  const filteredNeeds = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    return needs.filter((need) => {
      const user = getUser(need.user_id);

      const matchesSearch =
        !searchText ||
        need.title.toLowerCase().includes(searchText) ||
        need.description.toLowerCase().includes(searchText) ||
        need.category.toLowerCase().includes(searchText) ||
        need.city.toLowerCase().includes(searchText) ||
        need.locality.toLowerCase().includes(searchText) ||
        (user?.full_name || "").toLowerCase().includes(searchText) ||
        (user?.email || "").toLowerCase().includes(searchText);

      const matchesCategory =
        category === "All" || need.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [needs, profiles, search, category]);

  const categoryCount = new Set(needs.map((need) => need.category)).size;

  const latestNeed = needs.length > 0 ? needs[0] : null;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f4]">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-[#dfe7df] border-t-[#173d29]" />

          <p className="mt-5 font-semibold text-gray-500">
            Loading community needs...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8f4] text-[#173d29]">
      <div className="flex min-h-screen">

        {/* SIDEBAR */}

        <aside className="hidden w-72 shrink-0 bg-[#173d29] text-white lg:flex lg:flex-col">

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

          <nav className="flex-1 space-y-2 px-4 py-6">

            <button
              onClick={() => router.push("/admin/dashboard")}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left font-semibold text-green-100 transition hover:bg-white/10 hover:text-white"
            >
              <span>📊</span>
              Dashboard
            </button>

            <button
              onClick={() => router.push("/admin/users")}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left font-semibold text-green-100 transition hover:bg-white/10 hover:text-white"
            >
              <span>👥</span>
              Users
            </button>

            <button
              onClick={() => router.push("/admin/items")}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left font-semibold text-green-100 transition hover:bg-white/10 hover:text-white"
            >
              <span>📦</span>
              Items
            </button>

            <button
              className="flex w-full items-center gap-3 rounded-2xl bg-white/10 px-4 py-3.5 text-left font-bold"
            >
              <span>🙋</span>
              Community Needs
            </button>

            <button
              onClick={() => router.push("/admin/interests")}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left font-semibold text-green-100 transition hover:bg-white/10 hover:text-white"
            >
              <span>❤️</span>
              Interests
            </button>

            <button
              onClick={() => router.push("/dashboard")}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left font-semibold text-green-100 transition hover:bg-white/10 hover:text-white"
            >
              <span>👤</span>
              User Dashboard
            </button>

          </nav>

          <div className="border-t border-white/10 p-4">

            <div className="mb-3 rounded-2xl bg-white/10 p-4">
              <p className="text-xs text-green-200">
                Logged in as
              </p>

              <p className="mt-1 font-bold">
                Admin
              </p>

              <span className="mt-2 inline-block rounded-full bg-[#c63868] px-3 py-1 text-xs font-bold">
                ADMIN
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-semibold text-red-200 transition hover:bg-red-500/10"
            >
              <span>↪</span>
              Logout
            </button>

          </div>
        </aside>

        {/* MAIN */}

        <section className="min-w-0 flex-1">

          {/* HEADER */}

          <header className="border-b border-black/5 bg-[#f7f8f4] px-5 py-6 md:px-8">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>

                <p className="text-xs font-black tracking-[0.18em] text-[#c63868]">
                  ADMIN PANEL
                </p>

                <h2 className="mt-1 text-3xl font-black">
                  Community Needs
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Manage requests posted by the community.
                </p>

              </div>

              <button
                onClick={() => router.push("/admin/dashboard")}
                className="w-fit rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50"
              >
                ← Dashboard
              </button>

            </div>

          </header>

          <div className="p-5 md:p-8">

            {/* STATS */}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-gray-500">
                  Total Needs
                </p>

                <p className="mt-2 text-4xl font-black">
                  {needs.length}
                </p>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-gray-500">
                  Showing
                </p>

                <p className="mt-2 text-4xl font-black text-[#173d29]">
                  {filteredNeeds.length}
                </p>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-gray-500">
                  Categories
                </p>

                <p className="mt-2 text-4xl font-black text-[#c63868]">
                  {categoryCount}
                </p>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm">

                <p className="text-sm font-semibold text-gray-500">
                  Latest Need
                </p>

                <p className="mt-2 truncate text-lg font-black">
                  {latestNeed?.title || "No needs"}
                </p>

                {latestNeed && (
                  <p className="mt-1 text-xs text-gray-500">
                    {latestNeed.category}
                  </p>
                )}

              </div>

            </section>

            {/* SEARCH */}

            <section className="mt-8 rounded-3xl bg-white p-5 shadow-sm">

              <div className="flex flex-col gap-4 md:flex-row">

                <div className="flex-1">

                  <label className="mb-2 block text-sm font-bold text-gray-600">
                    Search needs
                  </label>

                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by title, description, user, city..."
                    className="w-full rounded-2xl border border-gray-200 bg-[#f7f8f4] px-4 py-3 outline-none transition focus:border-[#173d29]"
                  />

                </div>

                <div className="w-full md:w-60">

                  <label className="mb-2 block text-sm font-bold text-gray-600">
                    Category
                  </label>

                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-[#f7f8f4] px-4 py-3 outline-none"
                  >
                    {categories.map((itemCategory) => (
                      <option
                        key={itemCategory}
                        value={itemCategory}
                      >
                        {itemCategory}
                      </option>
                    ))}
                  </select>

                </div>

              </div>

            </section>

            {/* NEEDS TABLE */}

            <section className="mt-6 overflow-hidden rounded-3xl bg-white shadow-sm">

              <div className="border-b border-gray-100 px-6 py-5">

                <div className="flex items-center justify-between">

                  <div>
                    <h3 className="text-xl font-black">
                      All Community Needs
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      Showing {filteredNeeds.length} of {needs.length} needs
                    </p>
                  </div>

                  <span className="rounded-full bg-pink-50 px-3 py-1 text-xs font-bold text-[#c63868]">
                    {filteredNeeds.length} results
                  </span>

                </div>

              </div>

              {filteredNeeds.length > 0 ? (

                <div className="overflow-x-auto">

                  <table className="w-full min-w-[1100px]">

                    <thead>

                      <tr className="border-b border-gray-100 bg-[#f7f8f4] text-left">

                        <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500">
                          Need
                        </th>

                        <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500">
                          Category
                        </th>

                        <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500">
                          User
                        </th>

                        <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500">
                          Location
                        </th>

                        <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500">
                          Posted
                        </th>

                        <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500">
                          Action
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {filteredNeeds.map((need) => {

                        const user = getUser(need.user_id);

                        return (
                          <tr
                            key={need.id}
                            className="border-b border-gray-100 last:border-0 hover:bg-[#fafbf8]"
                          >

                            {/* NEED */}

                            <td className="max-w-[300px] px-6 py-5">

                              <p className="font-bold">
                                {need.title}
                              </p>

                              <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                                {need.description || "No description"}
                              </p>

                            </td>

                            {/* CATEGORY */}

                            <td className="px-6 py-5">

                              <span className="rounded-full bg-pink-100 px-3 py-1.5 text-xs font-bold text-[#c63868]">
                                {need.category}
                              </span>

                            </td>

                            {/* USER */}

                            <td className="px-6 py-5">

                              <p className="font-semibold">
                                {user?.full_name || "Unknown User"}
                              </p>

                              <p className="mt-1 max-w-[180px] truncate text-xs text-gray-500">
                                {user?.email || "No email"}
                              </p>

                            </td>

                            {/* LOCATION */}

                            <td className="px-6 py-5">

                              <p className="font-semibold">
                                {need.city || "Unknown"}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                {need.locality || "No locality"}
                              </p>

                            </td>

                            {/* DATE */}

                            <td className="whitespace-nowrap px-6 py-5 text-sm text-gray-500">
                              {new Date(
                                need.created_at
                              ).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>

                            {/* DELETE */}

                            <td className="px-6 py-5">

                              <button
                                onClick={() => deleteNeed(need)}
                                disabled={deletingId === need.id}
                                className="rounded-xl bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {deletingId === need.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>

                            </td>

                          </tr>
                        );
                      })}

                    </tbody>

                  </table>

                </div>

              ) : (

                <div className="px-6 py-16 text-center">

                  <div className="text-5xl">
                    🙋
                  </div>

                  <h3 className="mt-4 text-xl font-black">
                    No community needs found
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    Try changing your search or category filter.
                  </p>

                </div>

              )}

            </section>

          </div>

        </section>

      </div>
    </main>
  );
}
