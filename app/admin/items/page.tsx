"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Item = {
  id: string;
  title: string;
  category: string;
  condition: string;
  city: string;
  locality: string;
  image_url: string | null;
  created_at: string;
  owner_id: string;
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

export default function AdminItemsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
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

      const { data: itemsData, error: itemsError } = await supabase
        .from("items")
        .select(
          "id, title, category, condition, city, locality, image_url, created_at, owner_id"
        )
        .order("created_at", { ascending: false });

      if (itemsError) {
        console.error("Items error:", itemsError);
        return;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email");

      if (profilesError) {
        console.error("Profiles error:", profilesError);
      }

      setItems(itemsData || []);
      setProfiles(profilesData || []);
    } catch (error) {
      console.error("Admin items error:", error);
    } finally {
      setLoading(false);
    }
  }

  function getOwner(ownerId: string) {
    return profiles.find((profile) => profile.id === ownerId);
  }

  async function deleteItem(item: Item) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${item.title}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(item.id);

      const { error } = await supabase
        .from("items")
        .delete()
        .eq("id", item.id);

      if (error) {
        console.error("Delete item error:", error);
        alert(error.message);
        return;
      }

      setItems((currentItems) =>
        currentItems.filter((currentItem) => currentItem.id !== item.id)
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

  const filteredItems = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    return items.filter((item) => {
      const owner = getOwner(item.owner_id);

      const matchesSearch =
        !searchText ||
        item.title.toLowerCase().includes(searchText) ||
        item.category.toLowerCase().includes(searchText) ||
        item.city.toLowerCase().includes(searchText) ||
        item.locality.toLowerCase().includes(searchText) ||
        (owner?.full_name || "").toLowerCase().includes(searchText) ||
        (owner?.email || "").toLowerCase().includes(searchText);

      const matchesCategory =
        category === "All" || item.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [items, profiles, search, category]);

  const categoryCount = new Set(items.map((item) => item.category)).size;

  const latestItem = items.length > 0 ? items[0] : null;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f4]">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-[#dfe7df] border-t-[#173d29]" />

          <p className="mt-5 font-semibold text-gray-500">
            Loading items...
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
              className="flex w-full items-center gap-3 rounded-2xl bg-white/10 px-4 py-3.5 text-left font-bold"
            >
              <span>📦</span>
              Items
            </button>

            <button
              onClick={() => router.push("/admin/needs")}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left font-semibold text-green-100 transition hover:bg-white/10 hover:text-white"
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
                  Item Management
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Manage all items shared by the community.
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
                  Total Items
                </p>

                <p className="mt-2 text-4xl font-black">
                  {items.length}
                </p>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-gray-500">
                  Showing
                </p>

                <p className="mt-2 text-4xl font-black text-[#173d29]">
                  {filteredItems.length}
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
                  Latest Item
                </p>

                <p className="mt-2 truncate text-lg font-black">
                  {latestItem?.title || "No items"}
                </p>

                {latestItem && (
                  <p className="mt-1 text-xs text-gray-500">
                    {latestItem.category}
                  </p>
                )}
              </div>

            </section>

            {/* SEARCH */}

            <section className="mt-8 rounded-3xl bg-white p-5 shadow-sm">

              <div className="flex flex-col gap-4 md:flex-row">

                <div className="flex-1">

                  <label className="mb-2 block text-sm font-bold text-gray-600">
                    Search items
                  </label>

                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by title, owner, city, category..."
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

            {/* ITEMS TABLE */}

            <section className="mt-6 overflow-hidden rounded-3xl bg-white shadow-sm">

              <div className="border-b border-gray-100 px-6 py-5">

                <div className="flex items-center justify-between">

                  <div>
                    <h3 className="text-xl font-black">
                      All Items
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      Showing {filteredItems.length} of {items.length} items
                    </p>
                  </div>

                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                    {filteredItems.length} results
                  </span>

                </div>

              </div>

              {filteredItems.length > 0 ? (

                <div className="overflow-x-auto">

                  <table className="w-full min-w-[1050px]">

                    <thead>

                      <tr className="border-b border-gray-100 bg-[#f7f8f4] text-left">

                        <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500">
                          Item
                        </th>

                        <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500">
                          Category
                        </th>

                        <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500">
                          Condition
                        </th>

                        <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500">
                          Owner
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

                      {filteredItems.map((item) => {

                        const owner = getOwner(item.owner_id);

                        return (
                          <tr
                            key={item.id}
                            className="border-b border-gray-100 last:border-0 hover:bg-[#fafbf8]"
                          >

                            {/* ITEM */}

                            <td className="px-6 py-5">

                              <div className="flex items-center gap-3">

                                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#eaf0ea] text-2xl">

                                  {item.image_url ? (
                                    <img
                                      src={item.image_url}
                                      alt={item.title}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    "📦"
                                  )}

                                </div>

                                <div className="max-w-[230px]">

                                  <p className="truncate font-bold">
                                    {item.title}
                                  </p>

                                  <p className="mt-1 text-xs text-gray-500">
                                    ID: {item.id.slice(0, 8)}...
                                  </p>

                                </div>

                              </div>

                            </td>

                            {/* CATEGORY */}

                            <td className="px-6 py-5">

                              <span className="rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700">
                                {item.category}
                              </span>

                            </td>

                            {/* CONDITION */}

                            <td className="px-6 py-5 text-sm text-gray-600">
                              {item.condition || "Not specified"}
                            </td>

                            {/* OWNER */}

                            <td className="px-6 py-5">

                              <p className="font-semibold">
                                {owner?.full_name || "Unknown"}
                              </p>

                              <p className="mt-1 max-w-[180px] truncate text-xs text-gray-500">
                                {owner?.email || "No email"}
                              </p>

                            </td>

                            {/* LOCATION */}

                            <td className="px-6 py-5">

                              <p className="font-semibold">
                                {item.city || "Unknown"}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                {item.locality || "No locality"}
                              </p>

                            </td>

                            {/* DATE */}

                            <td className="whitespace-nowrap px-6 py-5 text-sm text-gray-500">
                              {new Date(
                                item.created_at
                              ).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>

                            {/* DELETE */}

                            <td className="px-6 py-5">

                              <button
                                onClick={() => deleteItem(item)}
                                disabled={deletingId === item.id}
                                className="rounded-xl bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {deletingId === item.id
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
                    📦
                  </div>

                  <h3 className="mt-4 text-xl font-black">
                    No items found
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