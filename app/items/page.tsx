
"use client";

import { useEffect, useState } from "react";
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

const categories = [
  { name: "Books", icon: "📚" },
  { name: "Clothes", icon: "👕" },
  { name: "Bags", icon: "🎒" },
  { name: "Furniture", icon: "🪑" },
  { name: "Toys", icon: "🧸" },
  { name: "Electronics", icon: "💻" },
  { name: "Stationery", icon: "✏️" },
  { name: "Household", icon: "🏠" },
];

export default function ItemsPage() {
  const supabase = createClient();
  const router = useRouter();

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [interestedItems, setInterestedItems] = useState<
    (string | number)[]
  >([]);

  const [conversationIds, setConversationIds] = useState<
    Record<string, number>
  >({});

  const [interestLoading, setInterestLoading] = useState<
    string | number | null
  >(null);

  const [chatLoading, setChatLoading] = useState<
    string | number | null
  >(null);

  const [deleteLoading, setDeleteLoading] = useState<
    string | number | null
  >(null);

  useEffect(() => {
    async function loadItems() {
      setLoading(true);
      setMessage("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setCurrentUserId(user.id);

      // Check user's role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile loading error:", profileError);
      }

      setIsAdmin(profile?.role === "admin");

      // Load items
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Items loading error:", error);
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setItems(data || []);

      // Load user's interests
      const { data: interests, error: interestError } = await supabase
        .from("interests")
        .select("item_id")
        .eq("interested_user_id", user.id);

      if (!interestError && interests) {
        setInterestedItems(interests.map((item) => item.item_id));
      }

      // Load existing conversations for this user
      const { data: conversations, error: conversationError } =
        await supabase
          .from("conversations")
          .select("id, item_id")
          .eq("interested_user_id", user.id);

      if (conversationError) {
        console.error(
          "Conversation loading error:",
          conversationError
        );
      }

      if (conversations) {
        const conversationMap: Record<string, number> = {};

        conversations.forEach((conversation) => {
          conversationMap[String(conversation.item_id)] =
            conversation.id;
        });

        setConversationIds(conversationMap);
      }

      setLoading(false);
    }

    loadItems();
  }, [router]);

  async function handleInterest(item: Item) {
    setInterestLoading(item.id);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    if (item.owner_id === user.id) {
      setMessage("You cannot show interest in your own item.");
      setInterestLoading(null);
      return;
    }

    // Already interested
    if (interestedItems.includes(item.id)) {
      setMessage("You have already shown interest in this item. ❤️");
      setInterestLoading(null);
      return;
    }

    // Create interest
    const { error } = await supabase.from("interests").insert({
      item_id: item.id,
      interested_user_id: user.id,
    });

    if (error) {
      console.error("Interest error:", error);

      if (error.code === "23505") {
        setInterestedItems((prev) =>
          prev.includes(item.id) ? prev : [...prev, item.id]
        );

        setMessage("You have already shown interest in this item. ❤️");
      } else {
        setMessage(error.message);
      }

      setInterestLoading(null);
      return;
    }

    setInterestedItems((prev) => [...prev, item.id]);

    /*
      Create a conversation automatically.

      The owner will be able to see this conversation
      from Who's Interested.
    */
    if (item.owner_id) {
      const { data: conversation, error: conversationError } =
        await supabase
          .from("conversations")
          .insert({
            item_id: item.id,
            owner_id: item.owner_id,
            interested_user_id: user.id,
          })
          .select("id")
          .single();

      if (conversationError) {
        // If conversation already exists, try to fetch it.
        if (conversationError.code === "23505") {
          const { data: existingConversation } = await supabase
            .from("conversations")
            .select("id")
            .eq("item_id", item.id)
            .eq("interested_user_id", user.id)
            .maybeSingle();

          if (existingConversation) {
            setConversationIds((prev) => ({
              ...prev,
              [String(item.id)]: existingConversation.id,
            }));
          }
        } else {
          console.error(
            "Conversation creation error:",
            conversationError
          );
        }
      } else if (conversation) {
        setConversationIds((prev) => ({
          ...prev,
          [String(item.id)]: conversation.id,
        }));
      }
    }

    setMessage(
      "Interest sent successfully! ❤️ You can now message the owner."
    );

    setInterestLoading(null);
  }

  async function handleChat(item: Item) {
    setChatLoading(item.id);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    if (!item.owner_id) {
      setMessage("Owner information is not available.");
      setChatLoading(null);
      return;
    }

    // If conversation already exists, open it.
    const existingConversationId =
      conversationIds[String(item.id)];

    if (existingConversationId) {
      router.push(`/chat/${existingConversationId}`);
      return;
    }

    // Safety check: make sure interest exists.
    const { data: existingInterest, error: interestError } =
      await supabase
        .from("interests")
        .select("id")
        .eq("item_id", item.id)
        .eq("interested_user_id", user.id)
        .maybeSingle();

    if (interestError) {
      console.error("Interest check error:", interestError);
      setMessage(interestError.message);
      setChatLoading(null);
      return;
    }

    if (!existingInterest) {
      setMessage(
        "Please show interest in this item before starting a chat."
      );
      setChatLoading(null);
      return;
    }

    // Create conversation if it doesn't exist.
    const { data: conversation, error: conversationError } =
      await supabase
        .from("conversations")
        .insert({
          item_id: item.id,
          owner_id: item.owner_id,
          interested_user_id: user.id,
        })
        .select("id")
        .single();

    if (conversationError) {
      if (conversationError.code === "23505") {
        const { data: existingConversation } = await supabase
          .from("conversations")
          .select("id")
          .eq("item_id", item.id)
          .eq("interested_user_id", user.id)
          .maybeSingle();

        if (existingConversation) {
          setConversationIds((prev) => ({
            ...prev,
            [String(item.id)]: existingConversation.id,
          }));

          router.push(`/chat/${existingConversation.id}`);
          return;
        }
      }

      console.error(
        "Conversation creation error:",
        conversationError
      );

      setMessage(
        conversationError.message ||
          "Unable to start chat. Please try again."
      );

      setChatLoading(null);
      return;
    }

    if (conversation) {
      setConversationIds((prev) => ({
        ...prev,
        [String(item.id)]: conversation.id,
      }));

      router.push(`/chat/${conversation.id}`);
      return;
    }

    setChatLoading(null);
  }

  async function handleDelete(item: Item) {
    if (!currentUserId) {
      router.push("/login");
      return;
    }

    const isOwner = item.owner_id === currentUserId;

    if (!isOwner && !isAdmin) {
      setMessage("You are not allowed to delete this item.");
      return;
    }

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

    setInterestedItems((prev) =>
      prev.filter((id) => id !== item.id)
    );

    setConversationIds((prev) => {
      const updated = { ...prev };
      delete updated[String(item.id)];
      return updated;
    });

    setMessage(`"${item.title}" has been deleted successfully. 🗑️`);

    setDeleteLoading(null);
  }

  function getCategoryIcon(category: string) {
    const found = categories.find((cat) => cat.name === category);
    return found?.icon || "📦";
  }

  function formatDate(date?: string) {
    if (!date) return "Recently shared";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const filteredItems =
    selectedCategory === "All"
      ? items
      : items.filter((item) => item.category === selectedCategory);

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

          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-[#f1eee6] hover:text-[#173d29] md:px-4"
            >
              Dashboard
            </button>

            <button
              onClick={() => router.push("/items/new")}
              className="rounded-xl bg-[#c63868] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-[#a92e57] hover:shadow-lg md:px-5"
            >
              <span className="mr-1">+</span>
              List Item
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#f2dce4] opacity-60 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 top-32 h-72 w-72 rounded-full bg-[#dcebdc] opacity-70 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 pb-8 pt-12 md:px-8 md:pb-12 md:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.3fr_0.7fr]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#dfe8dc] bg-white/80 px-4 py-2 text-sm font-bold text-[#356b45] shadow-sm">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#4d9b63]" />
                COMMUNITY MARKETPLACE
              </div>

              <h2 className="max-w-4xl text-4xl font-black leading-[1.05] tracking-tight text-[#173d29] md:text-6xl">
                Find something useful.
                <br />
                <span className="text-[#c63868]">
                  Give it a new home.
                </span>
              </h2>

              <p className="mt-6 max-w-2xl text-base leading-7 text-gray-600 md:text-lg">
                Explore things shared by people around the community. From
                books and clothes to furniture and electronics — something
                useful might be waiting for you.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  onClick={() => router.push("/items/new")}
                  className="rounded-2xl bg-[#173d29] px-6 py-3.5 font-bold text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-[#24573b] hover:shadow-xl"
                >
                  + Share an Item
                </button>

                <button
                  onClick={() => router.push("/needs")}
                  className="rounded-2xl border border-[#d9d6ce] bg-white px-6 py-3.5 font-bold text-[#173d29] shadow-sm transition duration-300 hover:-translate-y-1 hover:bg-[#f1eee6]"
                >
                  See Community Needs →
                </button>
              </div>
            </div>

            {/* HERO SIDE CARD */}
            <div className="relative hidden lg:block">
              <div className="rotate-2 rounded-[2.5rem] border border-white bg-white p-5 shadow-2xl">
                <div className="rounded-[2rem] bg-[#173d29] p-7 text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#b9d7bd]">
                        COMMUNITY
                      </p>

                      <p className="mt-1 text-2xl font-black">
                        Sharing is the new owning.
                      </p>
                    </div>

                    <div className="text-4xl">🤝</div>
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                      <p className="text-2xl font-black">
                        {items.length}
                      </p>

                      <p className="mt-1 text-xs text-[#cfe2d1]">
                        Items listed
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                      <p className="text-2xl font-black">♻️</p>

                      <p className="mt-1 text-xs text-[#cfe2d1]">
                        Less waste
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-5 -left-7 rounded-2xl bg-[#c63868] px-5 py-3 text-sm font-bold text-white shadow-xl">
                💗 Help • Share • Reuse
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY FILTER */}
      <section className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="rounded-[2rem] border border-[#e8e5dd] bg-white p-5 shadow-sm md:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black tracking-[0.2em] text-[#c63868]">
                EXPLORE
              </p>

              <h3 className="mt-1 text-2xl font-black text-[#173d29]">
                Browse by category
              </h3>
            </div>

            <p className="text-sm text-gray-500">
              {filteredItems.length}{" "}
              {filteredItems.length === 1 ? "item" : "items"} showing
            </p>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory("All")}
              className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-bold transition duration-300 ${
                selectedCategory === "All"
                  ? "bg-[#173d29] text-white shadow-md"
                  : "bg-[#f5f3ed] text-gray-600 hover:bg-[#e9eee7]"
              }`}
            >
              ✨ All Items
            </button>

            {categories.map((category) => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-bold transition duration-300 ${
                  selectedCategory === category.name
                    ? "bg-[#c63868] text-white shadow-md"
                    : "bg-[#f5f3ed] text-gray-600 hover:bg-[#f0e5e9]"
                }`}
              >
                {category.icon} {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* MESSAGE */}
      {message && (
        <div className="mx-auto max-w-7xl px-5 pt-7 md:px-8">
          <div className="flex items-start gap-3 rounded-2xl border border-[#dcebdc] bg-[#f1f8ef] p-4 text-sm font-semibold text-[#356b45] shadow-sm">
            <span className="text-lg">💚</span>
            <span>{message}</span>
          </div>
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <section className="mx-auto max-w-7xl px-5 py-20 text-center md:px-8">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#e6e4dc] border-t-[#173d29]" />

          <h3 className="mt-6 text-xl font-bold text-[#173d29]">
            Finding useful things...
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            Looking through the community marketplace.
          </p>
        </section>
      )}

      {/* ERROR */}
      {!loading && message && items.length === 0 && (
        <section className="mx-auto max-w-3xl px-5 py-16 md:px-8">
          <div className="rounded-[2rem] border border-[#ece9e1] bg-white p-10 text-center shadow-lg">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#f8e7ec] text-4xl">
              ⚠️
            </div>

            <h3 className="mt-6 text-2xl font-black text-[#173d29]">
              Something went wrong
            </h3>

            <p className="mt-2 text-gray-600">
              We couldn't load the items right now. Please refresh and try
              again.
            </p>

            <button
              onClick={() => window.location.reload()}
              className="mt-6 rounded-xl bg-[#173d29] px-6 py-3 font-bold text-white transition hover:bg-[#24573b]"
            >
              Try Again
            </button>
          </div>
        </section>
      )}

      {/* EMPTY */}
      {!loading && !message && items.length === 0 && (
        <section className="mx-auto max-w-3xl px-5 py-16 md:px-8">
          <div className="overflow-hidden rounded-[2.5rem] border border-[#e8e5dd] bg-white p-10 text-center shadow-lg md:p-14">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#f1eee6] text-5xl">
              📦
            </div>

            <p className="mt-7 text-xs font-black tracking-[0.2em] text-[#c63868]">
              BE THE FIRST
            </p>

            <h3 className="mt-2 text-3xl font-black text-[#173d29]">
              No items yet
            </h3>

            <p className="mx-auto mt-3 max-w-md leading-6 text-gray-600">
              Your community is waiting for its first useful share. List
              something you no longer need and give it another chance.
            </p>

            <button
              onClick={() => router.push("/items/new")}
              className="mt-7 rounded-2xl bg-[#173d29] px-7 py-3.5 font-bold text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-[#24573b]"
            >
              + List the First Item
            </button>
          </div>
        </section>
      )}

      {/* ITEMS */}
      {!loading && items.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 pb-20 pt-10 md:px-8 md:pt-12">
          <div className="mb-7 flex items-end justify-between">
            <div>
              <p className="text-xs font-black tracking-[0.2em] text-[#c63868]">
                AVAILABLE NOW
              </p>

              <h3 className="mt-1 text-3xl font-black text-[#173d29] md:text-4xl">
                Things looking for a new home
              </h3>
            </div>

            <div className="hidden text-sm text-gray-500 sm:block">
              ♻️ Give useful things a second chance
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="rounded-[2rem] border border-[#e8e5dd] bg-white p-12 text-center shadow-sm">
              <div className="text-5xl">🔎</div>

              <h3 className="mt-4 text-xl font-black text-[#173d29]">
                No items in this category
              </h3>

              <p className="mt-2 text-gray-500">
                Try another category to discover more items.
              </p>

              <button
                onClick={() => setSelectedCategory("All")}
                className="mt-5 rounded-xl bg-[#173d29] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#24573b]"
              >
                View All Items
              </button>
            </div>
          ) : (
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item, index) => {
                const isInterested = interestedItems.includes(item.id);
                const isInterestLoading =
                  interestLoading === item.id;
                const isChatLoading = chatLoading === item.id;
                const isDeleteLoading = deleteLoading === item.id;

                const isOwner = item.owner_id === currentUserId;
                const canDelete = isOwner || isAdmin;

                const conversationId =
                  conversationIds[String(item.id)];

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

                      <div className="absolute inset-0 bg-gradient-to-t from-[#173d29]/35 via-transparent to-transparent opacity-60" />

                      {/* Category */}
                      <span className="absolute left-4 top-4 rounded-full bg-[#173d29]/95 px-3.5 py-2 text-xs font-bold text-white shadow-lg backdrop-blur">
                        {getCategoryIcon(item.category)} {item.category}
                      </span>

                      {/* Condition */}
                      <span className="absolute right-4 top-4 rounded-full bg-white/95 px-3.5 py-2 text-xs font-black text-[#356b45] shadow-lg">
                        {item.condition}
                      </span>

                      {/* Owner/Admin badge */}
                      {canDelete && (
                        <span className="absolute bottom-4 left-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-black text-[#173d29] shadow-lg backdrop-blur">
                          {isAdmin && !isOwner
                            ? "🛡️ Admin"
                            : "👤 Your Item"}
                        </span>
                      )}
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

                      {/* Location */}
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

                      {/* Date */}
                      <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                        <span>
                          🕒 {formatDate(item.created_at)}
                        </span>

                        <span className="font-semibold text-[#356b45]">
                          Community Share
                        </span>
                      </div>

                      {/* INTEREST / CHAT */}
                      {!isOwner && (
                        <>
                          {!isInterested ? (
                            <button
                              onClick={() => handleInterest(item)}
                              disabled={isInterestLoading}
                              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#173d29] py-3.5 font-black text-white shadow-md transition duration-300 hover:-translate-y-0.5 hover:bg-[#24573b] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isInterestLoading ? (
                                <>
                                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                  Connecting...
                                </>
                              ) : (
                                <>❤️ I'm Interested</>
                              )}
                            </button>
                          ) : (
                            <div className="mt-5 space-y-2">
                              <div className="flex items-center justify-center gap-2 rounded-2xl bg-[#e9f1e5] py-3 text-sm font-black text-[#356b45]">
                                ✓ Interest Sent
                              </div>

                              <button
                                onClick={() => handleChat(item)}
                                disabled={isChatLoading}
                                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#c63868] py-3.5 font-black text-white shadow-md transition duration-300 hover:-translate-y-0.5 hover:bg-[#a92e57] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isChatLoading ? (
                                  <>
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    Opening chat...
                                  </>
                                ) : (
                                  <>💬 Message Owner</>
                                )}
                              </button>

                              {conversationId && (
                                <p className="text-center text-xs font-semibold text-gray-400">
                                  💚 You can now discuss the item with the owner
                                </p>
                              )}
                            </div>
                          )}
                        </>
                      )}

                      {/* OWNER / ADMIN DELETE */}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(item)}
                          disabled={isDeleteLoading}
                          className={`mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border py-3 font-black transition duration-300 ${
                            isDeleteLoading
                              ? "cursor-not-allowed border-red-100 bg-red-50 text-red-300"
                              : "border-red-200 bg-white text-red-600 hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-md"
                          }`}
                        >
                          {isDeleteLoading ? (
                            <>
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-500" />
                              Deleting...
                            </>
                          ) : (
                            <>🗑️ Delete Item</>
                          )}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* BOTTOM CTA */}
      {!loading && items.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 pb-20 md:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#173d29] p-8 text-white shadow-2xl md:p-12">
            <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/5" />
            <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-[#c63868]/20 blur-2xl" />

            <div className="relative flex flex-col items-start justify-between gap-7 md:flex-row md:items-center">
              <div>
                <p className="text-sm font-bold tracking-widest text-[#b9d7bd]">
                  HAVE SOMETHING TO SHARE?
                </p>

                <h3 className="mt-2 max-w-2xl text-3xl font-black md:text-4xl">
                  Someone nearby might need exactly what you don't.
                </h3>

                <p className="mt-3 max-w-xl leading-6 text-[#d1e2d3]">
                  Turn unused things into useful connections. Every shared
                  item can make a small difference.
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

          <p>♻️ Share more. Waste less. Help each other.</p>
        </div>
      </footer>
    </main>
  );
}

