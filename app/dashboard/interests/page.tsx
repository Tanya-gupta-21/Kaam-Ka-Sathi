
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Profile = {
  id: string;
  full_name: string | null;
  city: string | null;
  locality: string | null;
  avatar_url: string | null;
};

type Interest = {
  id: number;
  item_id: number;
  interested_user_id: string;
  created_at: string;
  item: {
    id: number;
    title: string;
    image_url: string | null;
    city: string;
    locality: string;
    category: string;
    condition: string;
  } | null;
  profile: Profile | null;
};

export default function InterestsPage() {
  const supabase = createClient();
  const router = useRouter();

  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [chatLoading, setChatLoading] = useState<number | null>(null);

  useEffect(() => {
    async function loadInterests() {
      setLoading(true);
      setMessage("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: ownerItems, error: itemsError } = await supabase
        .from("items")
        .select("id")
        .eq("owner_id", user.id);

      if (itemsError) {
        console.error(itemsError);
        setMessage(itemsError.message);
        setLoading(false);
        return;
      }

      const itemIds = (ownerItems || []).map((item) => item.id);

      if (itemIds.length === 0) {
        setInterests([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("interests")
        .select(
          `
          id,
          item_id,
          interested_user_id,
          created_at,
          items (
            id,
            title,
            image_url,
            city,
            locality,
            category,
            condition
          )
        `
        )
        .in("item_id", itemIds)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Interest loading error:", error);
        setMessage(error.message);
        setLoading(false);
        return;
      }

      const rawInterests = (data || []).map((interest: any) => ({
        id: interest.id,
        item_id: interest.item_id,
        interested_user_id: interest.interested_user_id,
        created_at: interest.created_at,
        item: Array.isArray(interest.items)
          ? interest.items[0] || null
          : interest.items || null,
      }));

      // Get all interested user IDs
      const userIds = [
        ...new Set(
          rawInterests.map(
            (interest: any) => interest.interested_user_id
          )
        ),
      ];

      let profiles: Profile[] = [];

      if (userIds.length > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, city, locality, avatar_url")
          .in("id", userIds);

        if (profileError) {
          console.error("Profile loading error:", profileError);
        } else {
          profiles = profileData || [];
        }
      }

      const formattedData: Interest[] = rawInterests.map(
        (interest: any) => ({
          ...interest,
          profile:
            profiles.find(
              (profile) => profile.id === interest.interested_user_id
            ) || null,
        })
      );

      setInterests(formattedData);
      setLoading(false);
    }

    loadInterests();
  }, [router]);

  function formatDate(date: string) {
    return new Date(date).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  async function handleChat(interest: Interest) {
    if (!interest.item) {
      setMessage("This item is no longer available.");
      return;
    }

    setChatLoading(interest.id);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const ownerId = user.id;
    const interestedUserId = interest.interested_user_id;

    // Check whether conversation already exists
    const { data: existingConversation, error: existingError } =
      await supabase
        .from("conversations")
        .select("id")
        .eq("item_id", interest.item_id)
        .eq("interested_user_id", interestedUserId)
        .maybeSingle();

    if (existingError) {
      console.error(existingError);
      setMessage(existingError.message);
      setChatLoading(null);
      return;
    }

    if (existingConversation) {
      router.push(`/chat/${existingConversation.id}`);
      return;
    }

    // Create a new conversation
    const { data: newConversation, error: createError } =
      await supabase
        .from("conversations")
        .insert({
          item_id: interest.item_id,
          owner_id: ownerId,
          interested_user_id: interestedUserId,
        })
        .select("id")
        .single();

    if (createError) {
      console.error(createError);
      setMessage(createError.message);
      setChatLoading(null);
      return;
    }

    router.push(`/chat/${newConversation.id}`);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8f4] text-[#193326]">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-[#e7f0e4] blur-3xl" />
        <div className="absolute -right-32 top-40 h-80 w-80 rounded-full bg-[#f7dce6] blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#eee8d9] blur-3xl" />
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-black/5 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="group flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#173d29] text-xl shadow-lg transition duration-300 group-hover:rotate-3 group-hover:scale-105">
              ♻️
            </div>

            <div className="text-left">
              <p className="text-lg font-black tracking-tight text-[#173d29]">
                Kaam Ka Saathi
              </p>

              <p className="text-[11px] font-medium text-gray-500">
                Your community connections
              </p>
            </div>
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-[#173d29] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            ← Dashboard
          </button>
        </div>
      </nav>

      {/* Main */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-[2.5rem] bg-[#173d29] p-7 text-white shadow-2xl sm:p-10">
          <div className="absolute -right-10 -top-16 h-52 w-52 rounded-full bg-white/5" />
          <div className="absolute -bottom-24 right-32 h-64 w-64 rounded-full bg-[#c63868]/20 blur-2xl" />

          <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/80 backdrop-blur">
                <span>💬</span>
                Community Connections
              </div>

              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                People who are interested
                <span className="ml-2">❤️</span>
              </h1>

              <p className="mt-4 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
                Someone found your shared item useful. See their basic
                profile details and start a conversation.
              </p>
            </div>

            <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-[2rem] bg-white/10 text-6xl backdrop-blur">
              🤝
            </div>
          </div>
        </section>

        {/* Stats */}
        {!loading && !message && interests.length > 0 && (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Total Interests
              </p>

              <div className="mt-2 flex items-center justify-between">
                <p className="text-3xl font-black text-[#173d29]">
                  {interests.length}
                </p>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f8e4eb] text-2xl">
                  ❤️
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Items Getting Attention
              </p>

              <div className="mt-2 flex items-center justify-between">
                <p className="text-3xl font-black text-[#173d29]">
                  {new Set(interests.map((item) => item.item_id)).size}
                </p>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e9f1e5] text-2xl">
                  📦
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Community Impact
              </p>

              <div className="mt-2 flex items-center justify-between">
                <p className="text-3xl font-black text-[#173d29]">
                  🌱
                </p>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f1eee6] text-2xl">
                  ♻️
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mt-10 rounded-[2rem] bg-white p-16 text-center shadow-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#e9f1e5]">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#cfe0d0] border-t-[#173d29]" />
            </div>

            <h3 className="mt-5 text-lg font-black text-[#173d29]">
              Checking your notifications...
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Looking for people interested in your items.
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && message && (
          <div className="mt-10 rounded-[2rem] border border-red-100 bg-white p-7 shadow-lg">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-2xl">
                ⚠️
              </div>

              <div>
                <h3 className="font-black text-red-700">
                  Something went wrong
                </h3>

                <p className="mt-1 text-sm leading-6 text-red-600">
                  {message}
                </p>

                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 rounded-full bg-[#173d29] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#24573b]"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && !message && interests.length === 0 && (
          <div className="mt-10 overflow-hidden rounded-[2.5rem] bg-white p-10 text-center shadow-xl sm:p-16">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-[#f1eee6] text-5xl">
              🔔
            </div>

            <h2 className="mt-7 text-3xl font-black text-[#173d29]">
              Your notifications are quiet
            </h2>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-gray-500">
              When someone shows interest in an item you've listed, you'll
              see their profile and chat option right here.
            </p>

            <div className="mx-auto mt-7 max-w-md rounded-2xl bg-[#f4f8f1] p-4 text-left">
              <div className="flex gap-3">
                <span className="text-xl">💡</span>

                <p className="text-xs leading-5 text-gray-600">
                  <span className="font-bold text-[#173d29]">
                    Want more connections?
                  </span>{" "}
                  Add useful items with clear photos and descriptions to make
                  your listings easier to discover.
                </p>
              </div>
            </div>

            <button
              onClick={() => router.push("/items/new")}
              className="mt-7 rounded-2xl bg-[#173d29] px-7 py-3.5 text-sm font-black text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-[#24573b] hover:shadow-xl"
            >
              List Another Item ♻️
            </button>
          </div>
        )}

        {/* Interest List */}
        {!loading && interests.length > 0 && (
          <section className="mt-10">
            <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-[#c63868]">
                  Your activity
                </p>

                <h2 className="mt-1 text-2xl font-black text-[#173d29]">
                  Recent interests
                </h2>
              </div>

              <p className="text-sm text-gray-500">
                Newest activity appears first
              </p>
            </div>

            <div className="space-y-6">
              {interests.map((interest) => {
                const profile = interest.profile;

                const personName =
                  profile?.full_name?.trim() || "Community Member";

                return (
                  <article
                    key={interest.id}
                    className="group overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
                  >
                    <div className="grid md:grid-cols-[280px_1fr]">
                      {/* Image */}
                      <div className="relative h-64 overflow-hidden bg-[#f1eee6] md:h-full md:min-h-[390px]">
                        {interest.item?.image_url ? (
                          <img
                            src={interest.item.image_url}
                            alt={interest.item.title}
                            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full min-h-[260px] items-center justify-center text-7xl">
                            📦
                          </div>
                        )}

                        <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-black text-[#173d29] shadow-md backdrop-blur">
                          ❤️ Interested
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6 sm:p-8">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-xs font-black uppercase tracking-widest text-[#c63868]">
                              Someone wants this
                            </p>

                            <h3 className="mt-2 text-2xl font-black tracking-tight text-[#173d29]">
                              {interest.item?.title || "Item"}
                            </h3>
                          </div>

                          <div className="hidden shrink-0 rounded-full bg-[#e9f1e5] px-4 py-2 text-xs font-black text-[#356b45] sm:block">
                            #{interest.item_id}
                          </div>
                        </div>

                        {/* Item tags */}
                        {interest.item && (
                          <>
                            <div className="mt-5 flex flex-wrap gap-2">
                              <span className="rounded-full bg-[#f1eee6] px-3 py-1.5 text-xs font-bold text-gray-600">
                                🏷️ {interest.item.category}
                              </span>

                              <span className="rounded-full bg-[#e9f1e5] px-3 py-1.5 text-xs font-bold text-[#356b45]">
                                ✨ {interest.item.condition}
                              </span>
                            </div>

                            <div className="mt-5 rounded-2xl bg-[#faf9f5] p-4">
                              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                Item location
                              </p>

                              <p className="mt-1 text-sm font-black text-[#173d29]">
                                📍 {interest.item.locality},{" "}
                                {interest.item.city}
                              </p>
                            </div>
                          </>
                        )}

                        {/* Interested Person */}
                        <div className="mt-6 rounded-[1.5rem] border border-[#eadfe3] bg-gradient-to-br from-[#fffafd] to-[#f8f5ef] p-5">
                          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                              {/* Avatar */}
                              {profile?.avatar_url ? (
                                <img
                                  src={profile.avatar_url}
                                  alt={personName}
                                  className="h-14 w-14 rounded-2xl object-cover shadow-sm"
                                />
                              ) : (
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#173d29] text-xl text-white shadow-sm">
                                  {personName.charAt(0).toUpperCase()}
                                </div>
                              )}

                              <div className="min-w-0">
                                <p className="text-[11px] font-black uppercase tracking-widest text-[#c63868]">
                                  Interested Person
                                </p>

                                <h4 className="mt-1 truncate text-lg font-black text-[#173d29]">
                                  {personName}
                                </h4>

                                {(profile?.city || profile?.locality) && (
                                  <p className="mt-1 text-xs font-medium text-gray-500">
                                    📍{" "}
                                    {[profile.locality, profile.city]
                                      .filter(Boolean)
                                      .join(", ")}
                                  </p>
                                )}

                                <p className="mt-1 text-[11px] text-gray-400">
                                  Interested on{" "}
                                  {formatDate(interest.created_at)}
                                </p>
                              </div>
                            </div>

                            {/* Chat button */}
                            <button
                              onClick={() => handleChat(interest)}
                              disabled={chatLoading === interest.id}
                              className="group/chat flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#173d29] px-5 py-3.5 text-sm font-black text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-[#24573b] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {chatLoading === interest.id ? (
                                <>
                                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                  Opening...
                                </>
                              ) : (
                                <>
                                  💬 Chat with {personName.split(" ")[0]}
                                  <span className="transition group-hover/chat:translate-x-1">
                                    →
                                  </span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Connection info */}
                        <div className="mt-5 rounded-2xl bg-[#173d29] p-5 text-white">
                          <div className="flex gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lg">
                              💬
                            </div>

                            <div>
                              <p className="text-sm font-black">
                                Ready to connect?
                              </p>

                              <p className="mt-1 text-xs leading-5 text-white/60">
                                Start a conversation to discuss the item,
                                availability and a suitable handover plan.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        {!loading && !message && interests.length > 0 && (
          <section className="mt-10 overflow-hidden rounded-[2rem] bg-[#f1eee6] p-7 sm:p-9">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-[#c63868]">
                  Keep the circle going
                </p>

                <h2 className="mt-2 text-2xl font-black text-[#173d29]">
                  Have more things to share?
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600">
                  List another useful item and help more people in your
                  community.
                </p>
              </div>

              <button
                onClick={() => router.push("/items/new")}
                className="shrink-0 rounded-2xl bg-[#173d29] px-6 py-3.5 text-sm font-black text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-[#24573b]"
              >
                + List New Item
              </button>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="py-10 text-center">
          <p className="text-sm font-bold text-[#173d29]">
            Kaam Ka Saathi ♻️
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Share • Reuse • Help • Connect
          </p>
        </footer>
      </div>
    </main>
  );
}

