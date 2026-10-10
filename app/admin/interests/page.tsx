"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Interest = {
  id: string;
  item_id: string;
  user_id: string;
  created_at: string;
};

type NeedInterest = {
  id: string;
  need_id: string;
  user_id: string;
  created_at: string;
};

type Item = {
  id: string;
  title: string;
  category: string;
};

type Need = {
  id: string;
  title: string;
  category: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
};

export default function AdminInterestsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);

  const [interests, setInterests] = useState<Interest[]>([]);
  const [needInterests, setNeedInterests] = useState<NeedInterest[]>([]);

  const [items, setItems] = useState<Item[]>([]);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  const [activeTab, setActiveTab] = useState<
    "items" | "needs"
  >("items");

  const [search, setSearch] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      // Check admin
      const { data: adminProfile, error: adminError } =
        await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

      if (
        adminError ||
        adminProfile?.role !== "admin"
      ) {
        router.replace("/dashboard");
        return;
      }

      // Item interests
      const { data: interestData, error: interestError } =
        await supabase
          .from("interests")
          .select("id, item_id, user_id, created_at")
          .order("created_at", {
            ascending: false,
          });

      if (interestError) {
        console.error(
          "Interests error:",
          interestError
        );
      }

      // Need interests
      const {
        data: needInterestData,
        error: needInterestError,
      } = await supabase
        .from("need_interests")
        .select("id, need_id, user_id, created_at")
        .order("created_at", {
          ascending: false,
        });

      if (needInterestError) {
        console.error(
          "Need interests error:",
          needInterestError
        );
      }

      // Items
      const { data: itemsData, error: itemsError } =
        await supabase
          .from("items")
          .select("id, title, category");

      if (itemsError) {
        console.error(
          "Items error:",
          itemsError
        );
      }

      // Needs
      const { data: needsData, error: needsError } =
        await supabase
          .from("needs")
          .select("id, title, category");

      if (needsError) {
        console.error(
          "Needs error:",
          needsError
        );
      }

      // Profiles
      const {
        data: profilesData,
        error: profilesError,
      } = await supabase
        .from("profiles")
        .select("id, full_name, email");

      if (profilesError) {
        console.error(
          "Profiles error:",
          profilesError
        );
      }

      setInterests(interestData || []);
      setNeedInterests(needInterestData || []);
      setItems(itemsData || []);
      setNeeds(needsData || []);
      setProfiles(profilesData || []);
    } catch (error) {
      console.error(
        "Admin interests error:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  function getItem(itemId: string) {
    return items.find(
      (item) => item.id === itemId
    );
  }

  function getNeed(needId: string) {
    return needs.find(
      (need) => need.id === needId
    );
  }

  function getUser(userId: string) {
    return profiles.find(
      (profile) => profile.id === userId
    );
  }

  async function deleteItemInterest(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this item interest?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);

      const { error } = await supabase
        .from("interests")
        .delete()
        .eq("id", id);

      if (error) {
        console.error(
          "Delete interest error:",
          error
        );

        alert(error.message);
        return;
      }

      setInterests((current) =>
        current.filter(
          (interest) => interest.id !== id
        )
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function deleteNeedInterest(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this help offer?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);

      const { error } = await supabase
        .from("need_interests")
        .delete()
        .eq("id", id);

      if (error) {
        console.error(
          "Delete help offer error:",
          error
        );

        alert(error.message);
        return;
      }

      setNeedInterests((current) =>
        current.filter(
          (interest) => interest.id !== id
        )
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

  const filteredItemInterests = useMemo(() => {
    const searchText =
      search.toLowerCase().trim();

    return interests.filter((interest) => {
      const item = getItem(interest.item_id);
      const user = getUser(interest.user_id);

      return (
        !searchText ||
        (item?.title || "")
          .toLowerCase()
          .includes(searchText) ||
        (item?.category || "")
          .toLowerCase()
          .includes(searchText) ||
        (user?.full_name || "")
          .toLowerCase()
          .includes(searchText) ||
        (user?.email || "")
          .toLowerCase()
          .includes(searchText)
      );
    });
  }, [
    interests,
    items,
    profiles,
    search,
  ]);

  const filteredNeedInterests = useMemo(() => {
    const searchText =
      search.toLowerCase().trim();

    return needInterests.filter(
      (interest) => {
        const need = getNeed(
          interest.need_id
        );

        const user = getUser(
          interest.user_id
        );

        return (
          !searchText ||
          (need?.title || "")
            .toLowerCase()
            .includes(searchText) ||
          (need?.category || "")
            .toLowerCase()
            .includes(searchText) ||
          (user?.full_name || "")
            .toLowerCase()
            .includes(searchText) ||
          (user?.email || "")
            .toLowerCase()
            .includes(searchText)
        );
      }
    );
  }, [
    needInterests,
    needs,
    profiles,
    search,
  ]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f4]">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-[#dfe7df] border-t-[#173d29]" />

          <p className="mt-5 font-semibold text-gray-500">
            Loading interests...
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
              onClick={() =>
                router.push("/admin/dashboard")
              }
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left font-semibold text-green-100 transition hover:bg-white/10 hover:text-white"
            >
              <span>📊</span>
              Dashboard
            </button>

            <button
              onClick={() =>
                router.push("/admin/users")
              }
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left font-semibold text-green-100 transition hover:bg-white/10 hover:text-white"
            >
              <span>👥</span>
              Users
            </button>

            <button
              onClick={() =>
                router.push("/admin/items")
              }
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left font-semibold text-green-100 transition hover:bg-white/10 hover:text-white"
            >
              <span>📦</span>
              Items
            </button>

            <button
              onClick={() =>
                router.push("/admin/needs")
              }
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left font-semibold text-green-100 transition hover:bg-white/10 hover:text-white"
            >
              <span>🙋</span>
              Community Needs
            </button>

            <button
              className="flex w-full items-center gap-3 rounded-2xl bg-white/10 px-4 py-3.5 text-left font-bold"
            >
              <span>❤️</span>
              Interests
            </button>

            <button
              onClick={() =>
                router.push("/dashboard")
              }
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
                  Interests & Help Offers
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Monitor interactions between users,
                  items and community needs.
                </p>

              </div>

              <button
                onClick={() =>
                  router.push("/admin/dashboard")
                }
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
                  Item Interests
                </p>

                <p className="mt-2 text-4xl font-black">
                  {interests.length}
                </p>

              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm">

                <p className="text-sm font-semibold text-gray-500">
                  Help Offers
                </p>

                <p className="mt-2 text-4xl font-black text-[#c63868]">
                  {needInterests.length}
                </p>

              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm">

                <p className="text-sm font-semibold text-gray-500">
                  Total Activity
                </p>

                <p className="mt-2 text-4xl font-black text-[#173d29]">
                  {interests.length +
                    needInterests.length}
                </p>

              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm">

                <p className="text-sm font-semibold text-gray-500">
                  Currently Showing
                </p>

                <p className="mt-2 text-4xl font-black">
                  {activeTab === "items"
                    ? filteredItemInterests.length
                    : filteredNeedInterests.length}
                </p>

              </div>

            </section>

            {/* SEARCH */}

            <section className="mt-8 rounded-3xl bg-white p-5 shadow-sm">

              <label className="mb-2 block text-sm font-bold text-gray-600">
                Search activity
              </label>

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search by item, need, category, user or email..."
                className="w-full rounded-2xl border border-gray-200 bg-[#f7f8f4] px-4 py-3 outline-none transition focus:border-[#173d29]"
              />

            </section>

            {/* TABS */}

            <section className="mt-6">

              <div className="flex w-full max-w-xl rounded-2xl bg-white p-1.5 shadow-sm">

                <button
                  onClick={() => {
                    setActiveTab("items");
                    setSearch("");
                  }}
                  className={`flex-1 rounded-xl px-5 py-3 text-sm font-black transition ${
                    activeTab === "items"
                      ? "bg-[#173d29] text-white"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  ❤️ Item Interests
                </button>

                <button
                  onClick={() => {
                    setActiveTab("needs");
                    setSearch("");
                  }}
                  className={`flex-1 rounded-xl px-5 py-3 text-sm font-black transition ${
                    activeTab === "needs"
                      ? "bg-[#c63868] text-white"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  🙋 Help Offers
                </button>

              </div>

            </section>

            {/* ITEM INTERESTS */}

            {activeTab === "items" && (

              <section className="mt-6 overflow-hidden rounded-3xl bg-white shadow-sm">

                <div className="border-b border-gray-100 px-6 py-5">

                  <h3 className="text-xl font-black">
                    Users Interested in Items
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    People who showed interest in listed items.
                  </p>

                </div>

                {filteredItemInterests.length > 0 ? (

                  <div className="overflow-x-auto">

                    <table className="w-full min-w-[900px]">

                      <thead>

                        <tr className="border-b border-gray-100 bg-[#f7f8f4] text-left">

                          <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500">
                            Item
                          </th>

                          <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500">
                            Category
                          </th>

                          <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500">
                            Interested User
                          </th>

                          <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500">
                            Date
                          </th>

                          <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500">
                            Action
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {filteredItemInterests.map(
                          (interest) => {

                            const item = getItem(
                              interest.item_id
                            );

                            const user = getUser(
                              interest.user_id
                            );

                            return (
                              <tr
                                key={interest.id}
                                className="border-b border-gray-100 last:border-0 hover:bg-[#fafbf8]"
                              >

                                <td className="px-6 py-5">

                                  <p className="font-bold">
                                    {item?.title ||
                                      "Item unavailable"}
                                  </p>

                                </td>

                                <td className="px-6 py-5">

                                  <span className="rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold text-[#173d29]">
                                    {item?.category ||
                                      "Unknown"}
                                  </span>

                                </td>

                                <td className="px-6 py-5">

                                  <p className="font-semibold">
                                    {user?.full_name ||
                                      "Unknown User"}
                                  </p>

                                  <p className="mt-1 text-xs text-gray-500">
                                    {user?.email ||
                                      "No email"}
                                  </p>

                                </td>

                                <td className="whitespace-nowrap px-6 py-5 text-sm text-gray-500">

                                  {new Date(
                                    interest.created_at
                                  ).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    }
                                  )}

                                </td>

                                <td className="px-6 py-5">

                                  <button
                                    onClick={() =>
                                      deleteItemInterest(
                                        interest.id
                                      )
                                    }
                                    disabled={
                                      deletingId ===
                                      interest.id
                                    }
                                    className="rounded-xl bg-red-50 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
                                  >
                                    {deletingId ===
                                    interest.id
                                      ? "Deleting..."
                                      : "Delete"}
                                  </button>

                                </td>

                              </tr>
                            );
                          }
                        )}

                      </tbody>

                    </table>

                  </div>

                ) : (

                  <div className="px-6 py-16 text-center">

                    <div className="text-5xl">
                      ❤️
                    </div>

                    <h3 className="mt-4 text-xl font-black">
                      No item interests found
                    </h3>

                    <p className="mt-2 text-sm text-gray-500">
                      No activity matches your search.
                    </p>

                  </div>

                )}

              </section>

            )}

            {/* NEED INTERESTS */}

            {activeTab === "needs" && (

              <section className="mt-6 overflow-hidden rounded-3xl bg-white shadow-sm">

                <div className="border-b border-gray-100 px-6 py-5">

                  <h3 className="text-xl font-black">
                    Help Offers
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Users who offered help for community needs.
                  </p>

                </div>

                {filteredNeedInterests.length > 0 ? (

                  <div className="overflow-x-auto">

                    <table className="w-full min-w-[900px]">

                      <thead>

                        <tr className="border-b border-gray-100 bg-[#f7f8f4] text-left">

                          <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500">
                            Need
                          </th>

                          <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500">
                            Category
                          </th>

                          <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500">
                            Helper
                          </th>

                          <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500">
                            Date
                          </th>

                          <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500">
                            Action
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {filteredNeedInterests.map(
                          (interest) => {

                            const need = getNeed(
                              interest.need_id
                            );

                            const user = getUser(
                              interest.user_id
                            );

                            return (
                              <tr
                                key={interest.id}
                                className="border-b border-gray-100 last:border-0 hover:bg-[#fafbf8]"
                              >

                                <td className="px-6 py-5">

                                  <p className="font-bold">
                                    {need?.title ||
                                      "Need unavailable"}
                                  </p>

                                </td>

                                <td className="px-6 py-5">

                                  <span className="rounded-full bg-pink-100 px-3 py-1.5 text-xs font-bold text-[#c63868]">
                                    {need?.category ||
                                      "Unknown"}
                                  </span>

                                </td>

                                <td className="px-6 py-5">

                                  <p className="font-semibold">
                                    {user?.full_name ||
                                      "Unknown User"}
                                  </p>

                                  <p className="mt-1 text-xs text-gray-500">
                                    {user?.email ||
                                      "No email"}
                                  </p>

                                </td>

                                <td className="whitespace-nowrap px-6 py-5 text-sm text-gray-500">

                                  {new Date(
                                    interest.created_at
                                  ).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    }
                                  )}

                                </td>

                                <td className="px-6 py-5">

                                  <button
                                    onClick={() =>
                                      deleteNeedInterest(
                                        interest.id
                                      )
                                    }
                                    disabled={
                                      deletingId ===
                                      interest.id
                                    }
                                    className="rounded-xl bg-red-50 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
                                  >
                                    {deletingId ===
                                    interest.id
                                      ? "Deleting..."
                                      : "Delete"}
                                  </button>

                                </td>

                              </tr>
                            );
                          }
                        )}

                      </tbody>

                    </table>

                  </div>

                ) : (

                  <div className="px-6 py-16 text-center">

                    <div className="text-5xl">
                      🙋
                    </div>

                    <h3 className="mt-4 text-xl font-black">
                      No help offers found
                    </h3>

                    <p className="mt-2 text-sm text-gray-500">
                      No activity matches your search.
                    </p>

                  </div>

                )}

              </section>

            )}

          </div>

        </section>

      </div>

    </main>
  );
}