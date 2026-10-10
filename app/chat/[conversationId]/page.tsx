"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  read_at: string | null;
};

type Conversation = {
  id: string;
  owner_id: string;
  interested_user_id: string;
  item_id: string | null;
  need_id: string | null;
};

type Profile = {
  id: string;
  full_name: string | null;
  last_seen: string | null;
};

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const conversationId = params.conversationId as string;

  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] =
    useState<Conversation | null>(null);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);
  const otherUserIdRef = useRef<string | null>(null);

  // --------------------------------------------------
  // LOAD CHAT
  // --------------------------------------------------
  useEffect(() => {
    if (!conversationId) return;

    loadChat();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId]);

  async function loadChat() {
    try {
      setLoading(true);

      // ---------------------------------------------
      // CURRENT USER
      // ---------------------------------------------
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      // ---------------------------------------------
      // CONVERSATION
      // ---------------------------------------------
      const { data: conversationData, error: conversationError } =
        await supabase
          .from("conversations")
          .select(
            "id, owner_id, interested_user_id, item_id, need_id"
          )
          .eq("id", conversationId)
          .single();

      if (conversationError) {
        console.error(
          "Conversation loading error:",
          conversationError
        );
        alert("Unable to load this conversation.");
        router.push("/chat");
        return;
      }

      if (!conversationData) {
        router.push("/chat");
        return;
      }

      // ---------------------------------------------
      // SECURITY CHECK
      // Only participants can open chat
      // ---------------------------------------------
      const isParticipant =
        conversationData.owner_id === user.id ||
        conversationData.interested_user_id === user.id;

      if (!isParticipant) {
        alert("You are not allowed to open this chat.");
        router.push("/chat");
        return;
      }

      setConversation(conversationData);

      // ---------------------------------------------
      // OTHER USER
      // ---------------------------------------------
      const otherId =
        conversationData.owner_id === user.id
          ? conversationData.interested_user_id
          : conversationData.owner_id;

      otherUserIdRef.current = otherId;

      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles")
          .select("id, full_name, last_seen")
          .eq("id", otherId)
          .single();

      if (profileError) {
        console.error(
          "Profile loading error:",
          profileError
        );
      } else {
        setOtherUser(profileData);
        setLastSeen(profileData?.last_seen ?? null);
      }

      // ---------------------------------------------
      // MESSAGES
      // IMPORTANT:
      // Your database uses `message`
      // NOT `content`
      // ---------------------------------------------
      const {
        data: messageData,
        error: messagesError,
      } = await supabase
        .from("messages")
        .select(
          "id, conversation_id, sender_id, message, created_at, read_at"
        )
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (messagesError) {
        console.error(
          "Messages loading error:",
          messagesError
        );
        return;
      }

      setMessages(messageData || []);

      // ---------------------------------------------
      // MARK INCOMING MESSAGES AS READ
      // ---------------------------------------------
      await markMessagesAsRead(user.id);

      // ---------------------------------------------
      // REALTIME CHANNEL
      // ---------------------------------------------
      setupRealtime(user.id, otherId);

      // ---------------------------------------------
      // UPDATE MY LAST SEEN
      // ---------------------------------------------
      await updateMyLastSeen(user.id);

      const lastSeenInterval = setInterval(() => {
        updateMyLastSeen(user.id);
      }, 30000);

      return () => {
        clearInterval(lastSeenInterval);
      };
    } catch (error) {
      console.error("loadChat error:", error);
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // REALTIME
  // --------------------------------------------------
  function setupRealtime(currentUserId: string, otherId: string) {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase.channel(
      `chat-${conversationId}`,
      {
        config: {
          presence: {
            key: currentUserId,
          },
        },
      }
    );

    // ---------------------------------------------
    // NEW MESSAGE
    // ---------------------------------------------
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload) => {
        const newMessage = payload.new as Message;

        // IMPORTANT:
        // We use `message`, never `content`
        if (!newMessage.message) {
          return;
        }

        setMessages((current) => {
          const alreadyExists = current.some(
            (item) => item.id === newMessage.id
          );

          if (alreadyExists) {
            return current;
          }

          return [...current, newMessage];
        });

        // If incoming message, mark it read immediately
        if (newMessage.sender_id !== currentUserId) {
          await supabase
            .from("messages")
            .update({
              read_at: new Date().toISOString(),
            })
            .eq("id", newMessage.id);
        }
      }
    );

    // ---------------------------------------------
    // MESSAGE READ UPDATE
    // ---------------------------------------------
    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const updatedMessage = payload.new as Message;

        setMessages((current) =>
          current.map((item) =>
            item.id === updatedMessage.id
              ? {
                  ...item,
                  ...updatedMessage,
                }
              : item
          )
        );
      }
    );

    // ---------------------------------------------
    // TYPING
    // ---------------------------------------------
    channel.on(
      "broadcast",
      { event: "typing" },
      (payload) => {
        if (payload.payload?.userId !== otherId) {
          return;
        }

        setIsOtherUserTyping(
          Boolean(payload.payload?.typing)
        );
      }
    );

    // ---------------------------------------------
    // PRESENCE
    // ---------------------------------------------
    channel.on(
      "presence",
      { event: "sync" },
      () => {
        const state = channel.presenceState();

        const otherPresent =
          state[otherId] &&
          state[otherId].length > 0;

        setIsOtherUserOnline(Boolean(otherPresent));
      }
    );

    channel.on(
      "presence",
      { event: "join" },
      ({ key }) => {
        if (key === otherId) {
          setIsOtherUserOnline(true);
        }
      }
    );

    channel.on(
      "presence",
      { event: "leave" },
      ({ key }) => {
        if (key === otherId) {
          setIsOtherUserOnline(false);
        }
      }
    );

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          userId: currentUserId,
          online_at: new Date().toISOString(),
        });
      }
    });

    channelRef.current = channel;
  }

  // --------------------------------------------------
  // UPDATE MY LAST SEEN
  // --------------------------------------------------
  async function updateMyLastSeen(currentUserId: string) {
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("profiles")
      .update({
        last_seen: now,
      })
      .eq("id", currentUserId);

    if (error) {
      console.error(
        "Last seen update error:",
        error
      );
    }
  }

  // --------------------------------------------------
  // MARK MESSAGES AS READ
  // --------------------------------------------------
  async function markMessagesAsRead(currentUserId: string) {
    const { error } = await supabase
      .from("messages")
      .update({
        read_at: new Date().toISOString(),
      })
      .eq("conversation_id", conversationId)
      .neq("sender_id", currentUserId)
      .is("read_at", null);

    if (error) {
      console.error(
        "Mark messages as read error:",
        error
      );
    }
  }

  // --------------------------------------------------
  // TYPING STATUS
  // --------------------------------------------------
  async function sendTypingStatus(isTyping: boolean) {
    if (!channelRef.current || !userId) {
      return;
    }

    try {
      await channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: {
          userId,
          typing: isTyping,
        },
      });
    } catch (error) {
      console.error(
        "Typing status error:",
        error
      );
    }
  }

  function handleMessageChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const value = e.target.value;

    setMessage(value);

    if (value.trim()) {
      sendTypingStatus(true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStatus(false);
      }, 1200);
    } else {
      sendTypingStatus(false);
    }
  }

  // --------------------------------------------------
  // SEND MESSAGE
  // --------------------------------------------------
  async function sendMessage() {
    const text = message.trim();

    if (!text || !userId || sending) {
      return;
    }

    try {
      setSending(true);

      // Stop typing
      await sendTypingStatus(false);

      // IMPORTANT:
      // Database column is `message`
      // NOT `content`
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          message: text,
        })
        .select(
          "id, conversation_id, sender_id, message, created_at, read_at"
        )
        .single();

      if (error) {
        console.error(
          "Send message error:",
          error
        );

        alert(
          `Message send failed:\n${error.message}`
        );

        return;
      }

      if (data) {
        setMessages((current) => {
          const alreadyExists = current.some(
            (item) => item.id === data.id
          );

          if (alreadyExists) {
            return current;
          }

          return [...current, data];
        });
      }

      setMessage("");
    } catch (error) {
      console.error(
        "Unexpected send message error:",
        error
      );

      alert(
        "Something went wrong while sending the message."
      );
    } finally {
      setSending(false);
    }
  }

  // --------------------------------------------------
  // ENTER TO SEND
  // --------------------------------------------------
  function handleKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  }

  // --------------------------------------------------
  // FORMAT TIME
  // --------------------------------------------------
  function formatTime(dateString: string) {
    return new Date(dateString).toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  // --------------------------------------------------
  // FORMAT LAST SEEN
  // --------------------------------------------------
  function formatLastSeen(
    dateString: string | null
  ) {
    if (!dateString) {
      return "Offline";
    }

    const date = new Date(dateString);
    const now = new Date();

    const diff =
      now.getTime() - date.getTime();

    const minutes = Math.floor(
      diff / (1000 * 60)
    );

    if (minutes < 1) {
      return "Last seen just now";
    }

    if (minutes < 60) {
      return `Last seen ${minutes} min ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `Last seen ${hours} hr ago`;
    }

    return `Last seen ${date.toLocaleDateString()}`;
  }

  // --------------------------------------------------
  // AUTO SCROLL
  // --------------------------------------------------
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isOtherUserTyping]);

  // --------------------------------------------------
  // VISIBILITY CHANGE
  // --------------------------------------------------
  useEffect(() => {
    if (!userId) return;

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible"
      ) {
        updateMyLastSeen(userId);

        markMessagesAsRead(userId);
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [userId]);

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fffaf7]">
        <div className="text-lg font-semibold text-[#173d29]">
          Loading chat...
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------
  return (
    <div className="flex min-h-screen flex-col bg-[#fffaf7]">
      {/* HEADER */}
      <header className="sticky top-0 z-20 border-b border-[#eadfd8] bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <button
            onClick={() => router.push("/chat")}
            className="rounded-full p-2 text-xl transition hover:bg-[#f7eee9]"
          >
            ←
          </button>

          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#c63868] font-bold text-white">
            {otherUser?.full_name
              ? otherUser.full_name
                  .charAt(0)
                  .toUpperCase()
              : "U"}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-bold text-[#173d29]">
              {otherUser?.full_name ||
                "User"}
            </h1>

            {isOtherUserTyping ? (
              <p className="text-xs font-medium text-[#c63868]">
                typing...
              </p>
            ) : isOtherUserOnline ? (
              <p className="text-xs font-medium text-green-600">
                Online
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                {formatLastSeen(lastSeen)}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* MESSAGES */}
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-5">
        <div className="flex-1 space-y-3">
          {messages.length === 0 ? (
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="text-center">
                <div className="mb-3 text-5xl">
                  💬
                </div>

                <h2 className="font-bold text-[#173d29]">
                  Start the conversation
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Send a message to connect.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine =
                msg.sender_id === userId;

              return (
                <div
                  key={msg.id}
                  className={`flex ${
                    isMine
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-2.5 shadow-sm ${
                      isMine
                        ? "rounded-br-md bg-[#c63868] text-white"
                        : "rounded-bl-md bg-white text-[#173d29]"
                    }`}
                  >
                    <p className="break-words text-sm leading-6">
                      {msg.message}
                    </p>

                    <div
                      className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                        isMine
                          ? "text-white/75"
                          : "text-gray-400"
                      }`}
                    >
                      <span>
                        {formatTime(
                          msg.created_at
                        )}
                      </span>

                      {isMine && (
                        <span
                          className={
                            msg.read_at
                              ? "font-bold text-blue-200"
                              : ""
                          }
                        >
                          ✓✓
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {isOtherUserTyping && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 text-gray-400 shadow-sm">
                <span className="animate-pulse">
                  •••
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* INPUT */}
      <div className="sticky bottom-0 border-t border-[#eadfd8] bg-white px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={handleMessageChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1 rounded-full border border-[#ded4ce] bg-[#fffaf7] px-5 py-3 text-sm outline-none transition focus:border-[#c63868] focus:ring-2 focus:ring-[#c63868]/10 disabled:opacity-60"
          />

          <button
            onClick={sendMessage}
            disabled={
              sending || !message.trim()
            }
            className="rounded-full bg-[#c63868] px-5 py-3 font-bold text-white shadow-sm transition hover:bg-[#a92e57] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}