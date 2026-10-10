"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type Conversation = {
  id: string;
  owner_id: string;
  interested_user_id: string;
  item_id: string | null;
};

type Profile = {
  id: string;
  full_name: string | null;
};

export default function ChatPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();

  const conversationId = params.conversationId as string;

  const [userId, setUserId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] =
    useState<Conversation | null>(null);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // -----------------------------
  // Get logged in user
  // -----------------------------
  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);
    }

    getUser();
  }, []);

  // -----------------------------
  // Load conversation + messages
  // -----------------------------
  useEffect(() => {
    if (!conversationId || !userId) return;

    async function loadChat() {
      setLoading(true);

      // Get conversation
      const { data: conversationData, error: conversationError } =
        await supabase
          .from("conversations")
          .select(
            "id, owner_id, interested_user_id, item_id"
          )
          .eq("id", conversationId)
          .single();

      if (conversationError || !conversationData) {
        console.error(conversationError);
        router.push("/items");
        return;
      }

      // Security check
      if (
        conversationData.owner_id !== userId &&
        conversationData.interested_user_id !== userId
      ) {
        router.push("/dashboard");
        return;
      }

      setConversation(conversationData);

      // Find other participant
      const otherUserId =
        conversationData.owner_id === userId
          ? conversationData.interested_user_id
          : conversationData.owner_id;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("id", otherUserId)
        .maybeSingle();

      setOtherUser(profileData);

      // Load messages
      const { data: messagesData, error: messagesError } =
        await supabase
          .from("messages")
          .select(
            "id, conversation_id, sender_id, content, created_at"
          )
          .eq("conversation_id", conversationId)
          .order("created_at", {
            ascending: true,
          });

      if (messagesError) {
        console.error(messagesError);
      } else {
        setMessages(messagesData || []);
      }

      setLoading(false);
    }

    loadChat();
  }, [conversationId, userId]);

  // -----------------------------
  // REAL-TIME SUBSCRIPTION
  // -----------------------------
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;

          setMessages((currentMessages) => {
            // Prevent duplicate messages
            const alreadyExists = currentMessages.some(
              (msg) => msg.id === newMessage.id
            );

            if (alreadyExists) {
              return currentMessages;
            }

            return [...currentMessages, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // -----------------------------
  // Auto scroll
  // -----------------------------
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // -----------------------------
  // Send message
  // -----------------------------
  async function sendMessage() {
    const text = message.trim();

    if (!text || !userId || sending) return;

    setSending(true);

    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: userId,
      content: text,
    });

    if (error) {
      console.error(error);
      alert("Message send nahi hua.");
    } else {
      setMessage("");
    }

    setSending(false);
  }

  // -----------------------------
  // Enter to send
  // -----------------------------
  function handleKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // -----------------------------
  // Loading
  // -----------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f8f4]">
        <div className="text-[#173d29] font-semibold">
          Loading chat...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#efeae2] flex flex-col">
      {/* Header */}
      <header className="bg-[#173d29] text-white px-4 py-3 flex items-center gap-3 shadow-md">
        <button
          onClick={() => router.back()}
          className="text-2xl hover:opacity-80"
        >
          ←
        </button>

        <div className="w-10 h-10 rounded-full bg-[#c63868] flex items-center justify-center font-bold">
          {otherUser?.full_name?.charAt(0).toUpperCase() ||
            "U"}
        </div>

        <div>
          <h1 className="font-semibold">
            {otherUser?.full_name || "User"}
          </h1>

          <p className="text-xs text-white/70">
            Online chat
          </p>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-5">
        <div className="max-w-4xl mx-auto space-y-2">
          {messages.length === 0 ? (
            <div className="flex justify-center py-10">
              <div className="bg-white rounded-xl px-5 py-3 shadow-sm text-sm text-gray-500">
                Start your conversation 👋
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === userId;

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
                    className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm ${
                      isMine
                        ? "bg-[#d9fdd3] rounded-br-sm"
                        : "bg-white rounded-bl-sm"
                    }`}
                  >
                    <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>

                    <div
                      className={`text-[10px] mt-1 ${
                        isMine
                          ? "text-gray-500 text-right"
                          : "text-gray-400"
                      }`}
                    >
                      {new Date(
                        msg.created_at
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-3">
        <div className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 rounded-full border border-gray-300 px-5 py-3 outline-none focus:border-[#173d29] focus:ring-1 focus:ring-[#173d29]"
          />

          <button
            onClick={sendMessage}
            disabled={!message.trim() || sending}
            className="w-12 h-12 rounded-full bg-[#c63868] text-white flex items-center justify-center font-bold hover:opacity-90 disabled:opacity-50"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}