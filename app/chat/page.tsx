
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Conversation = {
  id: string;
  owner_id: string;
  interested_user_id: string;
  item_id: string | null;
  need_id: string | null;
  service_id: string | null;
  created_at: string;
};

type Profile = {
  id: string;
  full_name: string | null;
};

type LastMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  read_at: string | null;
};

type ChatPreview = {
  conversation: Conversation;
  otherUser: Profile | null;
  lastMessage: LastMessage | null;
  unreadCount: number;
};

export default function ChatsPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Keep one Supabase client instance for this page.
  const [supabase] = useState(() => createClient());

  // =========================================
  // LOAD USER
  // =========================================

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (error || !user) {
        router.replace("/login");
        setLoading(false);
        return;
      }

      setUserId(user.id);
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  // =========================================
  // LOAD CHATS
  // =========================================

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    async function loadChats() {
      setLoading(true);

      try {
        const { data: conversations, error } =
          await supabase
            .from("conversations")
            .select(
              "id, owner_id, interested_user_id, item_id, need_id, service_id, created_at"
            )
            .or(
              `owner_id.eq.${userId},interested_user_id.eq.${userId}`
            )
            .order("created_at", { ascending: false });

        if (error) {
          console.error("Conversation loading error:", error);
          return;
        }

        if (!conversations?.length) {
          if (!cancelled) setChats([]);
          return;
        }

        const previews: ChatPreview[] = await Promise.all(
          conversations.map(async (conversation) => {
            const otherUserId =
              conversation.owner_id === userId
                ? conversation.interested_user_id
                : conversation.owner_id;

            const [profileResult, messageResult, unreadResult] =
              await Promise.all([
                supabase
                  .from("profiles_public")
                  .select("id, full_name")
                  .eq("id", otherUserId)
                  .maybeSingle(),

                // IMPORTANT: use `message`, NOT `content`
                supabase
                  .from("messages")
                  .select(
                    "id, conversation_id, sender_id, message, created_at, read_at"
                  )
                  .eq("conversation_id", conversation.id)
                  .order("created_at", { ascending: false })
                  .limit(1),

                supabase
                  .from("messages")
                  .select("id", {
                    count: "exact",
                    head: true,
                  })
                  .eq("conversation_id", conversation.id)
                  .neq("sender_id", userId)
                  .is("read_at", null),
              ]);

            if (profileResult.error) {
              console.error(
                "Profile loading error:",
                profileResult.error
              );
            }

            if (messageResult.error) {
              console.error(
                "Latest message loading error:",
                messageResult.error
              );
            }

            if (unreadResult.error) {
              console.error(
                "Unread count loading error:",
                unreadResult.error
              );
            }

            return {
              conversation,
              otherUser: profileResult.data ?? null,
              lastMessage: messageResult.data?.[0] ?? null,
              unreadCount: unreadResult.count ?? 0,
            };
          })
        );

        if (cancelled) return;

        // Most recently active chats first.
        previews.sort((a, b) => {
          const timeA = a.lastMessage
            ? new Date(a.lastMessage.created_at).getTime()
            : new Date(a.conversation.created_at).getTime();

          const timeB = b.lastMessage
            ? new Date(b.lastMessage.created_at).getTime()
            : new Date(b.conversation.created_at).getTime();

          return timeB - timeA;
        });

        setChats(previews);
      } catch (error) {
        console.error("Unexpected chat list error:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadChats();

    return () => {
      cancelled = true;
    };
  }, [userId, supabase]);

  // =========================================
  // REALTIME CHAT UPDATES
  // =========================================

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`chat-list-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMessage = payload.new as LastMessage;

          setChats((currentChats) => {
            const chatIndex = currentChats.findIndex(
              (chat) =>
                chat.conversation.id ===
                newMessage.conversation_id
            );

            // Reload if this conversation isn't in the list yet.
            if (chatIndex === -1) {
              return currentChats;
            }

            const updatedChats = [...currentChats];
            const currentChat = updatedChats[chatIndex];

            // Ignore an older event if a newer preview is already shown.
            const currentTime = currentChat.lastMessage
              ? new Date(
                  currentChat.lastMessage.created_at
                ).getTime()
              : 0;

            const incomingTime = new Date(
              newMessage.created_at
            ).getTime();

            const isNewer = incomingTime >= currentTime;
            const isMine = newMessage.sender_id === userId;

            updatedChats[chatIndex] = {
              ...currentChat,
              lastMessage: isNewer
                ? newMessage
                : currentChat.lastMessage,
              unreadCount: isMine
                ? currentChat.unreadCount
                : currentChat.unreadCount + 1,
            };

            updatedChats.sort((a, b) => {
              const timeA = a.lastMessage
                ? new Date(a.lastMessage.created_at).getTime()
                : new Date(a.conversation.created_at).getTime();

              const timeB = b.lastMessage
                ? new Date(b.lastMessage.created_at).getTime()
                : new Date(b.conversation.created_at).getTime();

              return timeB - timeA;
            });

            return updatedChats;
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const updatedMessage = payload.new as LastMessage;

          setChats((currentChats) =>
            currentChats.map((chat) => {
              if (
                chat.conversation.id !==
                updatedMessage.conversation_id
              ) {
                return chat;
              }

              const previousMessage = chat.lastMessage;

              const becameRead =
                previousMessage?.id === updatedMessage.id &&
                previousMessage.read_at === null &&
                updatedMessage.read_at !== null &&
                updatedMessage.sender_id !== userId;

              return {
                ...chat,
                lastMessage:
                  previousMessage?.id === updatedMessage.id
                    ? updatedMessage
                    : previousMessage,
                unreadCount: becameRead
                  ? Math.max(0, chat.unreadCount - 1)
                  : chat.unreadCount,
              };
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  // =========================================
  // OPEN CHAT
  // =========================================

  function openChat(conversationId: string) {
    router.push(`/chat/${conversationId}`);
  }

  // =========================================
  // FORMAT TIME
  // =========================================

  function formatChatTime(date?: string) {
    if (!date) return "";

    const messageDate = new Date(date);
    const now = new Date();

    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return messageDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  }

  // =========================================
  // FILTER AND UNREAD TOTAL
  // =========================================

  const filteredChats = chats.filter((chat) =>
    (chat.otherUser?.full_name || "User")
      .toLowerCase()
      .includes(search.toLowerCase().trim())
  );

  const totalUnread = useMemo(
    () =>
      chats.reduce(
        (total, chat) => total + chat.unreadCount,
        0
      ),
    [chats]
  );

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f4]">
        <div className="text-center">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-[#e5e5e5] border-t-[#173d29]" />
          <p className="mt-4 font-semibold text-[#173d29]">
            Loading your chats...
          </p>
        </div>
      </main>
    );
  }

  // =========================================
  // MAIN UI
  // =========================================

  return (
    <main className="min-h-screen bg-[#f7f8f4] text-[#173d29]">
      <header className="sticky top-0 z-50 border-b border-[#e5e2da] bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex h-10 w-10 items-center justify-center rounded-full text-2xl transition hover:bg-[#f1eee6]"
            aria-label="Back to dashboard"
          >
            ←
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-[#173d29]">
                Messages
              </h1>

              {totalUnread > 0 && (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#c63868] px-1.5 text-[11px] font-black text-white">
                  {totalUnread > 99 ? "99+" : totalUnread}
                </span>
              )}
            </div>

            <p className="text-xs text-gray-500">
              {totalUnread > 0
                ? `${totalUnread} unread ${
                    totalUnread === 1 ? "message" : "messages"
                  }`
                : "Your community conversations"}
            </p>
          </div>

          {totalUnread > 0 && (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fbe8ef] text-lg">
              🔴
            </div>
          )}
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {chats.length > 0 && (
          <div className="mb-5">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </span>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="w-full rounded-2xl border border-[#e5e2da] bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-[#173d29] focus:ring-1 focus:ring-[#173d29]"
              />
            </div>
          </div>
        )}

        {chats.length === 0 ? (
          <div className="rounded-[2rem] border border-[#e5e2da] bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#f1eee6] text-5xl">
              💬
            </div>

            <h2 className="mt-6 text-2xl font-black">
              No conversations yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Show interest in an item or offer help for a
              community need. Your conversations will appear here.
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                onClick={() => router.push("/items")}
                className="rounded-xl bg-[#173d29] px-6 py-3 font-bold text-white transition hover:bg-[#24573b]"
              >
                Browse Items
              </button>

              <button
                onClick={() => router.push("/needs")}
                className="rounded-xl border border-[#d9d6ce] bg-white px-6 py-3 font-bold text-[#173d29] transition hover:bg-[#f1eee6]"
              >
                See Community Needs
              </button>
            </div>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="rounded-2xl border border-[#e5e2da] bg-white p-10 text-center">
            <div className="text-4xl">🔎</div>

            <h2 className="mt-3 font-black">No chats found</h2>

            <p className="mt-1 text-sm text-gray-500">
              Try searching for another name.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[2rem] border border-[#e5e2da] bg-white shadow-sm">
            {filteredChats.map((chat, index) => {
              const name = chat.otherUser?.full_name || "User";
              const initial = name.charAt(0).toUpperCase();

              const isLastMessageMine =
                chat.lastMessage?.sender_id === userId;

              return (
                <button
                  key={chat.conversation.id}
                  onClick={() => openChat(chat.conversation.id)}
                  className={`flex w-full items-center gap-4 px-4 py-4 text-left transition hover:bg-[#f7f8f4] sm:px-6 ${
                    index !== filteredChats.length - 1
                      ? "border-b border-[#eeeae2]"
                      : ""
                  }`}
                >
                  <div
                    className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#c63868] text-lg font-black text-white ${
                      chat.unreadCount > 0
                        ? "ring-2 ring-[#c63868]/20"
                        : ""
                    }`}
                  >
                    {initial}

                    {chat.unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#173d29] px-1 text-[10px] font-black text-white shadow-sm">
                        {chat.unreadCount > 9
                          ? "9+"
                          : chat.unreadCount}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h2
                        className={`truncate text-base ${
                          chat.unreadCount > 0
                            ? "font-black"
                            : "font-bold"
                        }`}
                      >
                        {name}
                      </h2>

                      <span
                        className={`shrink-0 text-[11px] ${
                          chat.unreadCount > 0
                            ? "font-bold text-[#c63868]"
                            : "text-gray-400"
                        }`}
                      >
                        {formatChatTime(
                          chat.lastMessage?.created_at ||
                            chat.conversation.created_at
                        )}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-1">
                      {isLastMessageMine && (
                        <span
                          className={
                            chat.lastMessage?.read_at
                              ? "font-bold text-[#2388d9]"
                              : "text-gray-400"
                          }
                        >
                          {chat.lastMessage?.read_at ? "✓✓" : "✓"}
                        </span>
                      )}

                      <p
                        className={`truncate text-sm ${
                          chat.unreadCount > 0
                            ? "font-semibold text-[#173d29]"
                            : "text-gray-500"
                        }`}
                      >
                        {chat.lastMessage?.message ||
                          "Start a conversation 👋"}
                      </p>
                    </div>
                  </div>

                  {chat.unreadCount > 0 ? (
                    <span className="text-lg font-black text-[#c63868]">
                      ●
                    </span>
                  ) : (
                    <span className="text-xl text-gray-300">
                      ›
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
