"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePathname, useRouter } from "next/navigation";

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  message: string;
  payload: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
};

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, title, message, payload, read_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Could not load notifications:", error.message);
      return;
    }

    const rows = (data ?? []) as NotificationRow[];

    setNotifications(rows);
    setUnreadCount(rows.filter((item) => !item.read_at).length);
  }, [supabase]);

  useEffect(() => {
    setMenuOpen(false);
    setNotificationOpen(false);
  }, [pathname]);

  useEffect(() => {
    void fetchNotifications();

    const handleFocus = () => {
      void fetchNotifications();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchNotifications]);

  async function handleLogout() {
    setLoggingOut(true);

    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
  }

  async function toggleNotifications() {
    const opening = !notificationOpen;
    setNotificationOpen(opening);

    if (opening) {
      setNotificationsLoading(true);
      await fetchNotifications();
      setNotificationsLoading(false);
    }
  }

  async function openNotification(notification: NotificationRow) {
    const destination =
      notification.type === "new_message"
        ? typeof notification.payload?.conversation_id === "string"
          ? `/chat/${notification.payload.conversation_id}`
          : "/chat"
        : notification.type === "new_interest"
          ? "/needs"
          : "/notifications";

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

          setUnreadCount((count) => Math.max(0, count - 1));
        }
      }
    }

    setNotificationOpen(false);
    setMenuOpen(false);
    router.push(destination);
  }

  const links = [
    { label: "Dashboard", icon: "🏠", href: "/dashboard" },
    { label: "Browse Items", icon: "📦", href: "/items" },
    { label: "My Items", icon: "📦", href: "/dashboard/items" },
    { label: "Community Needs", icon: "🤝", href: "/needs" },
    { label: "My Needs", icon: "📋", href: "/dashboard/needs" },
    { label: "Who's Interested", icon: "❤️", href: "/dashboard/interests" },
  ];

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname.startsWith(href);
  }

  function NotificationBell() {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => void toggleNotifications()}
          aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
          aria-expanded={notificationOpen}
          className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-xl text-[#173d29] transition hover:bg-[#edf3ed]"
        >
          🔔

          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c63868] px-1 text-[10px] font-black text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {notificationOpen && (
          <>
            <button
              type="button"
              aria-label="Close notifications"
              onClick={() => setNotificationOpen(false)}
              className="fixed inset-0 z-40 cursor-default"
            />

            <div className="absolute right-0 top-14 z-50 w-[min(90vw,360px)] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
                <div>
                  <h3 className="font-black text-[#173d29]">Notifications</h3>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {unreadCount} unread
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setNotificationOpen(false);
                    router.push("/notifications");
                  }}
                  className="text-xs font-bold text-[#c63868] hover:underline"
                >
                  View all
                </button>
              </div>

              <div className="max-h-[360px] overflow-y-auto">
                {notificationsLoading ? (
                  <p className="px-4 py-8 text-center text-sm text-gray-500">
                    Loading notifications...
                  </p>
                ) : notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-2xl">✨</p>
                    <p className="mt-2 font-semibold text-gray-700">
                      You’re all caught up!
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      New messages and interests will appear here.
                    </p>
                  </div>
                ) : (
                  notifications.slice(0, 8).map((notification) => (
                    <button
                      type="button"
                      key={notification.id}
                      onClick={() => void openNotification(notification)}
                      className={`flex w-full gap-3 border-b border-gray-50 px-4 py-3 text-left transition hover:bg-[#f7faf7] ${
                        !notification.read_at ? "bg-[#edf3ed]/60" : "bg-white"
                      }`}
                    >
                      <span className="mt-0.5 text-xl">
                        {notification.type === "new_message" ? "💬" : "❤️"}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-[#173d29]">
                          {notification.title}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-gray-600">
                          {notification.message}
                        </span>
                        <span className="mt-1 block text-[10px] text-gray-400">
                          {new Date(notification.created_at).toLocaleString()}
                        </span>
                      </span>

                      {!notification.read_at && (
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#c63868]" />
                      )}
                    </button>
                  ))
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setNotificationOpen(false);
                  router.push("/notifications");
                }}
                className="w-full bg-[#fff0f4] px-4 py-3 text-sm font-bold text-[#c63868] transition hover:bg-[#ffe4ec]"
              >
                See all notifications →
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="flex h-[76px] items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="group flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#173d29] text-xl text-white shadow-lg transition duration-300 group-hover:rotate-3 group-hover:scale-105">
              ♻️
            </div>

            <div className="text-left">
              <h1 className="text-lg font-black tracking-tight text-[#173d29] md:text-xl">
                Kaam Ka Saathi
              </h1>
              <p className="hidden text-xs text-gray-500 sm:block">
                Share • Help • Reuse
              </p>
            </div>
          </button>

          <div className="hidden items-center gap-1 lg:flex">
            {links.map((link) => (
              <button
                type="button"
                key={link.href}
                onClick={() => router.push(link.href)}
                className={`relative rounded-xl px-3 py-2.5 text-sm font-bold transition duration-200 ${
                  isActive(link.href)
                    ? "bg-[#edf3ed] text-[#173d29]"
                    : "text-gray-500 hover:bg-gray-50 hover:text-[#173d29]"
                }`}
              >
                <span className="mr-1.5">{link.icon}</span>
                {link.label}

                {isActive(link.href) && (
                  <span className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 translate-y-1 rounded-full bg-[#c63868]" />
                )}
              </button>
            ))}
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <NotificationBell />

            <button
              type="button"
              onClick={() => router.push("/items/new")}
              className="rounded-xl bg-[#173d29] px-4 py-2.5 text-sm font-bold text-white shadow-md transition duration-300 hover:-translate-y-0.5 hover:bg-[#102d1e] hover:shadow-lg"
            >
              + Share Item
            </button>

            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={loggingOut}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition duration-200 hover:border-[#c63868] hover:text-[#c63868] disabled:opacity-50"
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <NotificationBell />

            <button
              type="button"
              onClick={() => router.push("/items/new")}
              className="hidden rounded-xl bg-[#173d29] px-4 py-2.5 text-sm font-bold text-white shadow-md sm:block"
            >
              + Share
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              aria-expanded={menuOpen}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-xl text-[#173d29] transition hover:bg-gray-50"
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-gray-100 pb-4 pt-3 lg:hidden">
            <div className="space-y-1">
              {links.map((link) => (
                <button
                  type="button"
                  key={link.href}
                  onClick={() => router.push(link.href)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition ${
                    isActive(link.href)
                      ? "bg-[#edf3ed] text-[#173d29]"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-lg">{link.icon}</span>
                  {link.label}

                  {isActive(link.href) && (
                    <span className="ml-auto text-[#c63868]">●</span>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => router.push("/items/new")}
                className="rounded-xl bg-[#173d29] px-4 py-3 text-sm font-bold text-white"
              >
                📦 Share Item
              </button>

              <button
                type="button"
                onClick={() => router.push("/needs/new")}
                className="rounded-xl bg-[#fff0f4] px-4 py-3 text-sm font-bold text-[#c63868]"
              >
                🙋 Post Need
              </button>
            </div>

            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={loggingOut}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-600 transition hover:border-[#c63868] hover:text-[#c63868] disabled:opacity-50"
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
