"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function handleLogout() {
    setLoggingOut(true);

    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
  }

  const links = [
    {
      label: "Dashboard",
      icon: "🏠",
      href: "/dashboard",
    },
    {
      label: "Browse Items",
      icon: "📦",
      href: "/items",
    },
    {
      label: "My Items",
      icon: "📦",
      href: "/dashboard/items",
    },
    {
      label: "Community Needs",
      icon: "🤝",
      href: "/needs",
    },
    {
      label: "My Needs",
      icon: "📋",
      href: "/dashboard/needs",
    },
    {
      label: "Who's Interested",
      icon: "❤️",
      href: "/dashboard/interests",
    },
  ];

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname.startsWith(href);
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="flex h-[76px] items-center justify-between">
          {/* LOGO */}
          <button
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

          {/* DESKTOP NAV */}
          <div className="hidden items-center gap-1 lg:flex">
            {links.map((link) => (
              <button
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

          {/* DESKTOP ACTIONS */}
          <div className="hidden items-center gap-2 lg:flex">
            <button
              onClick={() => router.push("/items/new")}
              className="rounded-xl bg-[#173d29] px-4 py-2.5 text-sm font-bold text-white shadow-md transition duration-300 hover:-translate-y-0.5 hover:bg-[#102d1e] hover:shadow-lg"
            >
              + Share Item
            </button>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition duration-200 hover:border-[#c63868] hover:text-[#c63868] disabled:opacity-50"
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>

          {/* TABLET / MOBILE */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => router.push("/items/new")}
              className="hidden rounded-xl bg-[#173d29] px-4 py-2.5 text-sm font-bold text-white shadow-md sm:block"
            >
              + Share
            </button>

            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-xl text-[#173d29] transition hover:bg-gray-50"
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}
        {menuOpen && (
          <div className="border-t border-gray-100 pb-4 pt-3 lg:hidden">
            <div className="space-y-1">
              {links.map((link) => (
                <button
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

            {/* MOBILE ACTIONS */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => router.push("/items/new")}
                className="rounded-xl bg-[#173d29] px-4 py-3 text-sm font-bold text-white"
              >
                📦 Share Item
              </button>

              <button
                onClick={() => router.push("/needs/new")}
                className="rounded-xl bg-[#fff0f4] px-4 py-3 text-sm font-bold text-[#c63868]"
              >
                🙋 Post Need
              </button>
            </div>

            {/* MOBILE LOGOUT */}
            <button
              onClick={handleLogout}
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