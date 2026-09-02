
"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";

type Conversation = {
  id: number;
  item_id: number | null;
  need_id: number | null;
  owner_id: string;
  interested_user_id: string;
  created_at: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  city: string | null;
  locality: string | null;
  avatar_url: string | null;
};

type Item = {
  id: number;
  title: string;
  image_url: string | null;
  city: string;
  locality: string;
};

type Need = {
  id: number;
  title: string;
  description: string | null;
  category: string;
  city: string;
  locality: string;
  created_at: string;
};

type Message = {
  id: number;
  conversation_id: number;
  sender_id: string;
  message: string;
  created_at: string;
};

export default function ChatPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();

  const conversationId = Number(params.conversationId);

  const [userId, setUserId] = useState("");
  const [conversation, setConversation] =
    useState<Conversation | null>(null);

  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [item, setItem] = useState<Item | null>(null);
  const [need, setNeed] = useState<Need | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!conversationId || Number.isNaN(conversationId)) {
      setError("Invalid conversation.");
      setLoading(false);
      return;
    }

    loadChat();
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function loadChat() {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setUserId(user.id);

    // --------------------------------
    // GET CONVERSATION
    // --------------------------------

    const { data: conversationData, error: conversationError } =
      await supabase
        .from("conversations")
        .select(
          "id, item_id, need_id, owner_id, interested_user_id, created_at"
        )
        .eq("id", conversationId)
        .maybeSingle();

    if (conversationError) {
      console.error(conversationError);
      setError(conversationError.message);
      setLoading(false);
      return;
    }

    if (!conversationData) {
      setError("Conversation not found.");
      setLoading(false);
      return;
    }

    // --------------------------------
    // SECURITY CHECK
    // --------------------------------

    const isParticipant =
      conversationData.owner_id === user.id ||
      conversationData.interested_user_id === user.id;

    if (!isParticipant) {
      setError("You don't have access to this conversation.");
      setLoading(false);
      return;
    }

    setConversation(conversationData);

    // --------------------------------
    // FIND OTHER USER
    // --------------------------------

    const otherUserId =
      conversationData.owner_id === user.id
        ? conversationData.interested_user_id
        : conversationData.owner_id;

    const { data: profileData, error: profileError } =
      await supabase
        .from("profiles")
        .select(
          "id, full_name, city, locality, avatar_url"
        )
        .eq("id", otherUserId)
        .maybeSingle();

    if (profileError) {
      console.error("Profile error:", profileError);
    }

    setOtherUser(profileData || null);

    // --------------------------------
    // GET ITEM IF ITEM CHAT
    // --------------------------------

    if (conversationData.item_id) {
      const { data: itemData, error: itemError } =
        await supabase
          .from("items")
          .select(
            "id, title, image_url, city, locality"
          )
          .eq("id", conversationData.item_id)
          .maybeSingle();

      if (itemError) {
        console.error("Item error:", itemError);
      }

      setItem(itemData || null);
    } else {
      setItem(null);
    }

    // --------------------------------
    // GET NEED IF NEED CHAT
    // --------------------------------

    if (conversationData.need_id) {
      const { data: needData, error: needError } =
        await supabase
          .from("needs")
          .select(
            "id, title, description, category, city, locality, created_at"
          )
          .eq("id", conversationData.need_id)
          .maybeSingle();

      if (needError) {
        console.error("Need error:", needError);
      }

      setNeed(needData || null);
    } else {
      setNeed(null);
    }

    // --------------------------------
    // GET MESSAGES
    // --------------------------------

    const { data: messageData, error: messageError } =
      await supabase
        .from("messages")
        .select(
          "id, conversation_id, sender_id, message, created_at"
        )
        .eq("conversation_id", conversationId)
        .order("created_at", {
          ascending: true,
        });

    if (messageError) {
      console.error(messageError);
      setError(messageError.message);
      setLoading(false);
      return;
    }

    setMessages(messageData || []);
    setLoading(false);
  }

  function scrollToBottom() {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }, 50);
  }

  async function sendMessage() {
    const cleanMessage = text.trim();

    if (!cleanMessage || !conversation || sending) {
      return;
    }

    setSending(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error: sendError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        message: cleanMessage,
      })
      .select(
        "id, conversation_id, sender_id, message, created_at"
      )
      .single();

    if (sendError) {
      console.error(sendError);
      setError(sendError.message);
      setSending(false);
      return;
    }

    setMessages((current) => [...current, data]);
    setText("");
    setSending(false);
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  function formatTime(date: string) {
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const otherName =
    otherUser?.full_name?.trim() || "Community Member";

  const isNeedChat = Boolean(conversation?.need_id);

  const contextTitle =
    need?.title || item?.title || "Community Conversation";

  const contextLocation = need
    ? `${need.locality}, ${need.city}`
    : item
    ? `${item.locality}, ${item.city}`
    : "";

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f4] px-5">
        <div className="w-full max-w-md rounded-[2rem] bg-white p-10 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#e9f1e5]">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#cfe0d0] border-t-[#173d29]" />
          </div>

          <h2 className="mt-5 text-xl font-black text-[#173d29]">
            Opening conversation...
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Getting everything ready for you.
          </p>
        </div>
      </main>
    );
  }

  if (error || !conversation) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f4] px-5">
        <div className="w-full max-w-lg rounded-[2rem] bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-4xl">
            ⚠️
          </div>

          <h2 className="mt-5 text-2xl font-black text-[#173d29]">
            Conversation unavailable
          </h2>

          <p className="mt-3 text-sm leading-6 text-gray-500">
            {error || "We couldn't find this conversation."}
          </p>

          <button
            onClick={() =>
              router.push("/dashboard/interests")
            }
            className="mt-6 rounded-2xl bg-[#173d29] px-6 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#24573b]"
          >
            ← Back to Interests
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8f4] text-[#193326]">

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 border-b border-black/5 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">

          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-[#173d29] transition hover:bg-[#f1eee6]"
          >
            ←
            <span className="hidden sm:inline">
              Back
            </span>
          </button>

          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#173d29] text-lg">
              ♻️
            </div>

            <p className="text-sm font-black text-[#173d29]">
              Kaam Ka Saathi
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-[#173d29] shadow-sm transition hover:shadow-md"
          >
            Dashboard
          </button>
        </div>
      </nav>

      {/* CHAT */}
      <div className="mx-auto flex min-h-[calc(100vh-65px)] max-w-5xl flex-col px-3 py-3 sm:px-6 sm:py-6">

        <div className="flex min-h-[calc(100vh-90px)] flex-1 flex-col overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-2xl">

          {/* HEADER */}
          <header className="relative overflow-hidden border-b border-black/5 bg-[#173d29] px-5 py-5 text-white sm:px-7">

            <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/5" />

            <div className="relative flex items-center justify-between gap-4">

              <div className="flex min-w-0 items-center gap-3">

                {/* AVATAR */}
                {otherUser?.avatar_url ? (
                  <img
                    src={otherUser.avatar_url}
                    alt={otherName}
                    className="h-12 w-12 shrink-0 rounded-2xl object-cover ring-2 ring-white/10"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-lg font-black backdrop-blur">
                    {otherName.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0">

                  <div className="flex items-center gap-2">

                    <h1 className="truncate text-lg font-black">
                      {otherName}
                    </h1>

                    <span className="h-2 w-2 rounded-full bg-[#9ee6a8]" />

                  </div>

                  <p className="mt-0.5 truncate text-xs text-white/60">
                    {otherUser?.locality && otherUser?.city
                      ? `📍 ${otherUser.locality}, ${otherUser.city}`
                      : otherUser?.city
                      ? `📍 ${otherUser.city}`
                      : "Community Member"}
                  </p>

                </div>
              </div>

              {/* CONTEXT */}
              <div className="hidden shrink-0 text-right sm:block">

                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                  {isNeedChat
                    ? "Need conversation"
                    : "Item conversation"}
                </p>

                <p className="mt-1 max-w-[220px] truncate text-sm font-bold">
                  {contextTitle}
                </p>

              </div>

            </div>
          </header>

          {/* CONTEXT CARD */}
          {(item || need) && (
            <div className="border-b border-black/5 bg-[#faf9f5] px-5 py-3 sm:px-7">

              <div className="flex items-center gap-3">

                {/* ICON / IMAGE */}
                {item?.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="h-12 w-12 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#eee8d9] text-xl">
                    {need ? "🙋" : "📦"}
                  </div>
                )}

                <div className="min-w-0 flex-1">

                  <p className="text-[10px] font-black uppercase tracking-widest text-[#c63868]">
                    {need ? "Need" : "Item"}
                  </p>

                  <p className="truncate text-sm font-black text-[#173d29]">
                    {contextTitle}
                  </p>

                  {contextLocation && (
                    <p className="truncate text-[11px] text-gray-500">
                      📍 {contextLocation}
                    </p>
                  )}

                </div>

                <div className="hidden rounded-full bg-[#e9f1e5] px-3 py-1.5 text-[10px] font-bold text-[#356b45] sm:block">
                  {need
                    ? "🤝 Helping a community need"
                    : "♻️ Community sharing"}
                </div>

              </div>

            </div>
          )}

          {/* MESSAGES */}
          <section className="flex-1 overflow-y-auto bg-[#fcfcfa] px-4 py-6 sm:px-7">

            {messages.length === 0 ? (
              <div className="flex min-h-[380px] items-center justify-center">

                <div className="max-w-sm text-center">

                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.7rem] bg-[#f1eee6] text-4xl">
                    💬
                  </div>

                  <h2 className="mt-5 text-xl font-black text-[#173d29]">
                    Start the conversation
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    Say hello and discuss{" "}
                    {need ? "the need" : "the item"} with{" "}
                    {otherName}.
                  </p>

                  <div className="mt-5 rounded-2xl bg-[#e9f1e5] px-4 py-3 text-left">

                    <p className="text-xs leading-5 text-[#356b45]">
                      💡 Keep personal information private and
                      discuss the item or need and handover details
                      safely.
                    </p>

                  </div>

                </div>

              </div>
            ) : (
              <div className="mx-auto flex max-w-3xl flex-col gap-3">

                {messages.map((msg) => {

                  const mine =
                    msg.sender_id === userId;

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${
                        mine
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >

                      <div
                        className={`${
                          mine
                            ? "items-end"
                            : "items-start"
                        } flex max-w-[82%] flex-col sm:max-w-[65%]`}
                      >

                        <div
                          className={`rounded-[1.4rem] px-4 py-3 text-sm leading-6 shadow-sm ${
                            mine
                              ? "rounded-br-md bg-[#173d29] text-white"
                              : "rounded-bl-md border border-black/5 bg-white text-[#193326]"
                          }`}
                        >
                          {msg.message}
                        </div>

                        <span className="mt-1 px-1 text-[10px] text-gray-400">
                          {formatTime(msg.created_at)}
                        </span>

                      </div>

                    </div>
                  );
                })}

                <div ref={messagesEndRef} />

              </div>
            )}

          </section>

          {/* ERROR */}
          {error && (
            <div className="border-t border-red-100 bg-red-50 px-5 py-3">
              <p className="text-xs font-medium text-red-600">
                ⚠️ {error}
              </p>
            </div>
          )}

          {/* COMPOSER */}
          <div className="border-t border-black/5 bg-white p-3 sm:p-4">

            <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-[1.5rem] border border-gray-200 bg-[#faf9f5] p-2 shadow-sm transition focus-within:border-[#173d29] focus-within:shadow-md">

              <textarea
                value={text}
                onChange={(e) =>
                  setText(e.target.value)
                }
                onKeyDown={handleKeyDown}
                rows={1}
                maxLength={1000}
                placeholder={`Message ${otherName}...`}
                className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-[#193326] outline-none placeholder:text-gray-400"
              />

              <button
                onClick={sendMessage}
                disabled={!text.trim() || sending}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#173d29] text-lg text-white shadow-md transition duration-300 hover:-translate-y-0.5 hover:bg-[#24573b] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Send message"
              >
                {sending ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  "➤"
                )}
              </button>

            </div>

            <div className="mx-auto mt-2 flex max-w-3xl items-center justify-between px-2">

              <p className="text-[10px] text-gray-400">
                Enter to send • Shift + Enter for new line
              </p>

              <p className="text-[10px] text-gray-400">
                {text.length}/1000
              </p>

            </div>

          </div>

        </div>

        {/* FOOTER */}
        <div className="py-4 text-center">

          <p className="text-[11px] text-gray-400">
            Conversation started on{" "}
            {formatDate(conversation.created_at)} • Kaam Ka Saathi ♻️
          </p>

        </div>

      </div>
    </main>
  );
}
