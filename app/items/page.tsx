"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Item = {
id: string;
title: string;
description: string;
category: string;
condition: string;
city: string;
locality: string;
created_at?: string;
};

export default function ItemsPage() {
const supabase = createClient();
const router = useRouter();

const [items, setItems] = useState<Item[]>([]);
const [loading, setLoading] = useState(true);
const [message, setMessage] = useState("");

useEffect(() => {
async function loadItems() {
const {
data: { user },
} = await supabase.auth.getUser();


  if (!user) {
    router.push("/login");
    return;
  }

  const { data, error } = await supabase
    .from("items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    setMessage(error.message);
  } else {
    setItems(data || []);
  }

  setLoading(false);
}

loadItems();


}, [router, supabase]);

return ( <main className="min-h-screen bg-[#faf9f5] text-[#193326]"> <nav className="border-b border-[#e7e4dc] bg-white"> <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4"> <div> <h1 className="text-2xl font-bold text-[#173d29]">
Kaam Ka Sathi ♻️ </h1> <p className="text-sm text-gray-500">
Find useful things near you </p> </div>


      <button
        onClick={() => router.push("/dashboard")}
        className="rounded-xl bg-[#173d29] px-5 py-2 font-semibold text-white hover:bg-[#24573b]"
      >
        Dashboard
      </button>
    </div>
  </nav>

  <section className="mx-auto max-w-7xl px-6 py-10">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <p className="font-semibold text-[#c63868]">
          COMMUNITY ITEMS
        </p>

        <h2 className="mt-2 text-4xl font-bold">
          Things looking for a new home
        </h2>

        <p className="mt-3 text-gray-600">
          Browse useful items shared by people in the community.
        </p>
      </div>

      <button
        onClick={() => router.push("/items/new")}
        className="rounded-xl bg-[#c63868] px-6 py-3 font-semibold text-white hover:bg-[#a92e57]"
      >
        + List an Item
      </button>
    </div>

    {loading && (
      <div className="mt-12 text-center text-gray-500">
        Loading items...
      </div>
    )}

    {message && (
      <div className="mt-8 rounded-xl bg-red-50 p-4 text-sm text-red-700">
        {message}
      </div>
    )}

    {!loading && !message && items.length === 0 && (
      <div className="mt-12 rounded-3xl bg-white p-12 text-center shadow-sm">
        <div className="text-5xl">📦</div>

        <h3 className="mt-5 text-2xl font-bold">
          No items yet
        </h3>

        <p className="mt-2 text-gray-600">
          Be the first person to share something useful!
        </p>

        <button
          onClick={() => router.push("/items/new")}
          className="mt-6 rounded-xl bg-[#173d29] px-6 py-3 font-semibold text-white"
        >
          List First Item
        </button>
      </div>
    )}

    {!loading && !message && items.length > 0 && (
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="text-4xl">
                {item.category === "Books"
                  ? "📚"
                  : item.category === "Clothes"
                    ? "👕"
                    : item.category === "Bags"
                      ? "🎒"
                      : item.category === "Furniture"
                        ? "🪑"
                        : item.category === "Toys"
                          ? "🧸"
                          : item.category === "Electronics"
                            ? "💻"
                            : item.category === "Stationery"
                              ? "✏️"
                              : "🏠"}
              </div>

              <span className="rounded-full bg-[#e9f1e5] px-3 py-1 text-xs font-semibold text-[#356b45]">
                {item.condition}
              </span>
            </div>

            <h3 className="mt-5 text-xl font-bold">
              {item.title}
            </h3>

            <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">
              {item.description}
            </p>

            <div className="mt-5 border-t border-gray-100 pt-4">
              <p className="text-sm font-semibold">
                📍 {item.locality}, {item.city}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Category: {item.category}
              </p>
            </div>

            <button
              onClick={() =>
                alert(
                  "This item is available. Contact/matching feature will be added next."
                )
              }
              className="mt-5 w-full rounded-xl bg-[#173d29] py-3 font-semibold text-white hover:bg-[#24573b]"
            >
              I’m Interested
            </button>
          </div>
        ))}
      </div>
    )}
  </section>
</main>


);
}
