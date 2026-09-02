"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Item = {
  id: string | number;
  title: string;
  description: string;
  category: string;
  condition: string;
  city: string;
  locality: string;
  image_url?: string | null;
  created_at?: string;
  owner_id?: string;
};

type Interest = {
  id: string | number;
  item_id: string | number;
};

const categories = [
  { name: "Books", icon: "📚" },
  { name: "Clothes", icon: "👕" },
  { name: "Bags", icon: "🎒" },
  { name: "Furniture", icon: "🪑" },
  { name: "Toys", icon: "🧸" },
  { name: "Electronics", icon: "💻" },
  { name: "Stationery", icon: "✏️" },
  { name: "Household", icon: "🏠" },
  { name: "Other", icon: "📦" },
];

export default function MyItemsPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [items, setItems] = useState<Item[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<
    string | number | null
  >(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadMyItems() {
      setLoading(true);
      setMessage("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Load only current user's items
      const { data: itemData, error: itemError } = await supabase
        .from("items")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (itemError) {
        console.error("My items loading error:", itemError);
        setMessage(itemError.message);
        setLoading(false);
        return;
      }

      const myItems = itemData || [];
      setItems(myItems);

      // Load interests for user's items
      if (myItems.length > 0) {
        const itemIds = myItems.map((item) => item.id);

        const { data: interestData, error: interestError } =
          await supabase
            .from("interests")
            .select("id, item_id")
            .in("item_id", itemIds);

        if (interestError) {
          console.error(
            "Interests loading error:",
            interestError
          );
        } else {
          setInterests(interestData || []);
        }
      }

      setLoading(false);
    }

    loadMyItems();
  }, [router, supabase]);

  function getCategoryIcon(category: string) {
    const found = categories.find(
      (cat) => cat.name === category
    );

    return found?.icon || "📦";
  }

  function formatDate(date?: string) {
    if (!date) return "Recently listed";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function getInterestCount(itemId: string | number) {
    return interests.filter(
      (interest) => interest.item_id === itemId
    ).length;
  }

  async function handleDelete(item: Item) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${item.title}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setDeleteLoading(item.id);
    setMessage("");

    const { error } = await supabase
      .from("items")
      .delete()
      .eq("id", item.id);

    if (error) {
      console.error("Delete item error:", error);

      setMessage(
        error.message ||
          "Unable to delete this item. Please try again."
      );

      setDeleteLoading(null);
      return;
    }

    setItems((prev) =>
      prev.filter((existing) => existing.id !== item.id)
    );

    setInterests((prev) =>
      prev.filter((interest) => interest.item_id !== item.id)
    );

    setMessage(
      `"${item.title}" has been removed successfully. 🗑️`
    );

    setDeleteLoading(null);
  }

  const totalInterests = interests.length;

  return (
    <main className="min-h-screen bg-[#f7f8f4] text-[#193326]">

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 border-b border-[#e8e5dd] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">

          <button
            onClick={() => router.push("/dashboard")}
            className="group text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl transition duration-300 group-hover:rotate-12">
                ♻️
              </span>

              <div>
                <h1 className="text-xl font-black tracking-tight text-[#173d29] md:text-2xl">
                  Kaam Ka Saathi
                </h1>

                <p className="hidden text-xs text-gray-500 sm:block">
                  Give useful things a second chance
                </p>
              </div>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/items")}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-[#f1eee6] hover:text-[#173d29] md:px-4"
            >
              Browse Items
            </button>

            <button
              onClick={() => router.push("/items/new")}
              className="rounded-xl bg-[#c63868] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-[#a92e57] hover:shadow-lg"
            >
              <span className="mr-1">+</span>
              List Item
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#f2dce4] opacity-60 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 top-20 h-80 w-80 rounded-full bg-[#dcebdc] opacity-70 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 pb-10 pt-12 md:px-8 md:pb-14 md:pt-16">

          <div className="grid items-center gap-8 lg:grid-cols-[1.3fr_0.7fr]">

            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#dfe8dc] bg-white/80 px-4 py-2 text-sm font-bold text-[#356b45] shadow-sm">
                <span className="h-2 w-2 rounded-full bg-[#4d9b63]" />
                YOUR SHARED ITEMS
              </div>

              <h2 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-[#173d29] md:text-6xl">
                Everything you've
                <br />
                <span className="text-[#c63868]">
                  shared with others.
                </span>
              </h2>

              <p className="mt-6 max-w-2xl text-base leading-7 text-gray-600 md:text-lg">
                Keep track of the useful things you've listed on
                Kaam Ka Saathi and see how many people are interested.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  onClick={() => router.push("/items/new")}
                  className="rounded-2xl bg-[#173d29] px-6 py-3.5 font-bold text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-[#24573b] hover:shadow-xl"
                >
                  + List Another Item
                </button>

                <button
                  onClick={() => router.push("/items")}
                  className="rounded-2xl border border-[#d9d6ce] bg-white px-6 py-3.5 font-bold text-[#173d29] shadow-sm transition duration-300 hover:-translate-y-1 hover:bg-[#f1eee6]"
                >
                  Browse Community →
                </button>
              </div>
            </div>

            {/* STATS CARD */}
            <div className="rounded-[2.5rem] bg-[#173d29] p-7 text-white shadow-2xl md:p-8">

              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold tracking-widest text-[#b9d7bd]">
                    YOUR IMPACT
                  </p>

                  <h3 className="mt-2 text-2xl font-black">
                    Small shares matter.
                  </h3>
                </div>

                <span className="text-4xl">💚</span>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3">

                <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
                  <p className="text-3xl font-black">
                    {items.length}
                  </p>

                  <p className="mt-1 text-xs text-[#cfe2d1]">
                    Items listed
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
                  <p className="text-3xl font-black">
                    {totalInterests}
                  </p>

                  <p className="mt-1 text-xs text-[#cfe2d1]">
                    People interested
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* MESSAGE */}
      {message && (
        <div className="mx-auto max-w-7xl px-5 pb-5 md:px-8">
          <div className="rounded-2xl border border-[#dcebdc] bg-[#f1f8ef] p-4 text-sm font-semibold text-[#356b45] shadow-sm">
            💚 {message}
          </div>
        </div>
      )}

      {/* CONTENT */}
      <section className="mx-auto max-w-7xl px-5 pb-20 md:px-8">

        <div className="mb-7 flex items-end justify-between">
          <div>
            <p className="text-xs font-black tracking-[0.2em] text-[#c63868]">
              MY ITEMS
            </p>

            <h3 className="mt-1 text-3xl font-black text-[#173d29] md:text-4xl">
              Items you've listed
            </h3>
          </div>

          <p className="hidden text-sm text-gray-500 sm:block">
            {items.length}{" "}
            {items.length === 1 ? "item" : "items"} shared
          </p>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="rounded-[2rem] border border-[#e8e5dd] bg-white p-16 text-center shadow-sm">

            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#e6e4dc] border-t-[#173d29]" />

            <h3 className="mt-6 text-xl font-bold text-[#173d29]">
              Loading your items...
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Fetching everything you've shared.
            </p>

          </div>
        )}

        {/* EMPTY */}
        {!loading && items.length === 0 && (
          <div className="overflow-hidden rounded-[2.5rem] border border-[#e8e5dd] bg-white p-10 text-center shadow-lg md:p-16">

            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#f1eee6] text-5xl">
              📦
            </div>

            <p className="mt-7 text-xs font-black tracking-[0.2em] text-[#c63868]">
              NOTHING HERE YET
            </p>

            <h3 className="mt-2 text-3xl font-black text-[#173d29]">
              You haven't listed anything
            </h3>

            <p className="mx-auto mt-3 max-w-md leading-6 text-gray-600">
              Have something useful sitting around? Give it a
              second life by sharing it with someone nearby.
            </p>

            <button
              onClick={() => router.push("/items/new")}
              className="mt-7 rounded-2xl bg-[#173d29] px-7 py-3.5 font-bold text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-[#24573b]"
            >
              + List Your First Item
            </button>

          </div>
        )}

        {/* ITEMS GRID */}
        {!loading && items.length > 0 && (
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">

            {items.map((item, index) => {
              const interestCount = getInterestCount(item.id);
              const isDeleting = deleteLoading === item.id;

              return (
                <article
                  key={item.id}
                  className="group overflow-hidden rounded-[2rem] border border-[#e8e5dd] bg-white shadow-sm transition duration-500 hover:-translate-y-2 hover:shadow-2xl"
                  style={{
                    animationDelay: `${index * 80}ms`,
                  }}
                >

                  {/* IMAGE */}
                  <div className="relative h-64 overflow-hidden bg-[#f1eee6]">

                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center">

                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/80 text-5xl shadow-sm transition duration-500 group-hover:scale-110">
                          {getCategoryIcon(item.category)}
                        </div>

                        <p className="mt-3 text-xs font-semibold text-gray-500">
                          No photo available
                        </p>

                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-[#173d29]/40 via-transparent to-transparent" />

                    <span className="absolute left-4 top-4 rounded-full bg-[#173d29]/95 px-3.5 py-2 text-xs font-bold text-white shadow-lg backdrop-blur">
                      {getCategoryIcon(item.category)} {item.category}
                    </span>

                    <span className="absolute right-4 top-4 rounded-full bg-white/95 px-3.5 py-2 text-xs font-black text-[#356b45] shadow-lg">
                      {item.condition}
                    </span>

                    <span className="absolute bottom-4 left-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-black text-[#173d29] shadow-lg">
                      👤 Your Item
                    </span>

                  </div>

                  {/* CONTENT */}
                  <div className="p-6">

                    <div className="flex items-start justify-between gap-3">

                      <h4 className="text-xl font-black leading-tight text-[#173d29] transition group-hover:text-[#c63868]">
                        {item.title}
                      </h4>

                      <span className="shrink-0 text-lg opacity-70">
                        ♻️
                      </span>

                    </div>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">
                      {item.description}
                    </p>

                    {/* LOCATION */}
                    <div className="mt-5 flex items-center gap-3 rounded-2xl bg-[#f7f8f4] p-4">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                        📍
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#173d29]">
                          {item.locality}, {item.city}
                        </p>

                        <p className="mt-0.5 text-xs text-gray-500">
                          Community location
                        </p>
                      </div>

                    </div>

                    {/* INTEREST + DATE */}
                    <div className="mt-4 grid grid-cols-2 gap-3">

                      <div className="rounded-2xl bg-[#fdf0f4] p-4">
                        <p className="text-xl font-black text-[#c63868]">
                          ❤️ {interestCount}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-gray-500">
                          Interested
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#f7f8f4] p-4">
                        <p className="text-sm font-black text-[#173d29]">
                          🕒 {formatDate(item.created_at)}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-gray-500">
                          Listed date
                        </p>
                      </div>

                    </div>

                    {/* INTEREST BUTTON */}
                    {interestCount > 0 && (
                      <button
                        onClick={() =>
                          router.push("/dashboard/interests")
                        }
                        className="mt-4 w-full rounded-2xl bg-[#173d29] py-3 font-black text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[#24573b] hover:shadow-lg"
                      >
                        ❤️ View Interested People
                      </button>
                    )}

                    {/* DELETE */}
                    <button
                      onClick={() => handleDelete(item)}
                      disabled={isDeleting}
                      className={`mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border py-3 font-black transition duration-300 ${
                        isDeleting
                          ? "cursor-not-allowed border-red-100 bg-red-50 text-red-300"
                          : "border-red-200 bg-white text-red-600 hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-md"
                      }`}
                    >
                      {isDeleting ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-500" />
                          Deleting...
                        </>
                      ) : (
                        <>🗑️ Delete Item</>
                      )}
                    </button>

                  </div>
                </article>
              );
            })}

          </div>
        )}
      </section>

      {/* BOTTOM CTA */}
      {!loading && (
        <section className="mx-auto max-w-7xl px-5 pb-20 md:px-8">

          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#173d29] p-8 text-white shadow-2xl md:p-12">

            <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/5" />

            <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-[#c63868]/20 blur-2xl" />

            <div className="relative flex flex-col items-start justify-between gap-7 md:flex-row md:items-center">

              <div>
                <p className="text-sm font-bold tracking-widest text-[#b9d7bd]">
                  KEEP SHARING
                </p>

                <h3 className="mt-2 max-w-2xl text-3xl font-black md:text-4xl">
                  Your unused things can become someone else's useful things.
                </h3>

                <p className="mt-3 max-w-xl leading-6 text-[#d1e2d3]">
                  Every item you share keeps something useful in circulation
                  and helps build a stronger community.
                </p>
              </div>

              <button
                onClick={() => router.push("/items/new")}
                className="shrink-0 rounded-2xl bg-white px-7 py-3.5 font-black text-[#173d29] shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-[#f8f5ed]"
              >
                + List an Item
              </button>

            </div>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="border-t border-[#e5e2da] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-sm text-gray-500 md:flex-row md:items-center md:justify-between md:px-8">

          <p>
            © {new Date().getFullYear()}{" "}
            <span className="font-bold text-[#173d29]">
              Kaam Ka Saathi
            </span>
          </p>

          <p>
            ♻️ Share more. Waste less. Help each other.
          </p>

        </div>
      </footer>

    </main>
  );
}