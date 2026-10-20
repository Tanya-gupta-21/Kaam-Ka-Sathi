"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  message: string;
  payload: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
};

export default function NotificationsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = notifications.filter((item) => !item.read_at).length;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, title, message, payload, read_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage("Notifications could not be loaded. Please try again.");
      console.error("Could not load notifications:", error.message);
      setLoading(false);
      return;
    }

    setNotifications((data ?? []) as NotificationRow[]);
    setLoading(false);
  }, [router, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchNotifications(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchNotifications]);

  async function openNotification(notification: NotificationRow) {
    const destination =
      notification.type === "new_message"
        ? typeof notification.payload?.conversation_id === "string"
          ? `/chat/${notification.payload.conversation_id}`
          : "/chat"
        : notification.type === "new_interest"
          ? "/needs"
          : "/dashboard";

    if (!notification.read_at) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase
          .from("notifications")
          .update({ read_at: new Date().toISOString() })
          .eq("id", notification.id)
          .eq("user_id", user.id);

        if (error) {
          console.error("Could not mark notification as read:", error.message);
        } else {
          setNotifications((current) =>
            current.map((item) =>
              item.id === notification.id
                ? { ...item, read_at: new Date().toISOString() }
                : item
            )
          );
        }
      }
    }

    router.push(destination);
  }

  async function markAllAsRead() {
    if (unreadCount === 0 || markingAll) return;

    setMarkingAll(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMarkingAll(false);
      router.replace("/login");
      return;
    }

    const now = new Date().toISOString();

    const { error } = await supabase
      .from("notifications")
      .update({ read_at: now })
      .eq("user_id", user.id)
      .is("read_at", null);

    if (error) {
      setErrorMessage("Could not mark notifications as read. Please try again.");
      console.error("Could not mark notifications as read:", error.message);
    } else {
      setNotifications((current) =>
        current.map((item) =>
          item.read_at ? item : { ...item, read_at: now }
        )
      );
    }

    setMarkingAll(false);
  }

  return (
    <main className="min-h-screen bg-[#f7f9f6]">
      <Navbar />

      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-[#c63868]">
              Stay connected
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-[#173d29] sm:text-4xl">
              Notifications 🔔
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Keep track of messages and community interest in your posts.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void markAllAsRead()}
            disabled={unreadCount === 0 || markingAll}
            className="rounded-xl border border-[#173d29]/15 bg-white px-4 py-3 text-sm font-bold text-[#173d29] transition hover:bg-[#edf3ed] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {markingAll ? "Updating..." : "✓ Mark all as read"}
          </button>
        </div>

        <div className="mb-5 rounded-2xl border border-[#173d29]/10 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500">Unread notifications</p>
              <p className="mt-1 text-3xl font-black text-[#173d29]">
                {unreadCount}
              </p>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff0f4] text-2xl">
              🔔
            </div>
          </div>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {errorMessage}
            <button
              type="button"
              onClick={() => void fetchNotifications()}
              className="ml-2 font-bold underline"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center text-gray-500 shadow-sm">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white px-6 py-14 text-center shadow-sm">
            <div className="text-5xl">🌱</div>
            <h2 className="mt-4 text-xl font-black text-[#173d29]">
              No notifications yet
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
              When someone messages you or shows interest in a community need,
              you’ll see the update here.
            </p>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="mt-6 rounded-xl bg-[#173d29] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#102d1e]"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            {notifications.map((notification) => (
              <button
                type="button"
                key={notification.id}
                onClick={() => void openNotification(notification)}
                className={`flex w-full items-start gap-4 border-b border-gray-100 p-5 text-left transition last:border-b-0 hover:bg-[#f7faf7] sm:p-6 ${
                  !notification.read_at ? "bg-[#edf3ed]/60" : "bg-white"
                }`}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fff0f4] text-xl">
                  {notification.type === "new_message" ? "💬" : "❤️"}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-[#173d29]">
                      {notification.title}
                    </h2>
                    {!notification.read_at && (
                      <span className="rounded-full bg-[#c63868]/10 px-2 py-0.5 text-[10px] font-bold text-[#c63868]">
                        NEW
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    {notification.message}
                  </p>

                  <p className="mt-2 text-xs text-gray-400">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>

                <span className="pt-1 text-gray-400">→</span>
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
