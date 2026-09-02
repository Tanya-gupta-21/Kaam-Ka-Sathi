"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const categories = [
    { icon: "📚", name: "Books", text: "Study essentials" },
    { icon: "👕", name: "Clothes", text: "Wear • Share • Reuse" },
    { icon: "🎒", name: "Bags", text: "Carry & reuse" },
    { icon: "🪑", name: "Furniture", text: "Give it a new home" },
    { icon: "🧸", name: "Toys", text: "Pass the joy on" },
    { icon: "💻", name: "Electronics", text: "Tech with a second life" },
    { icon: "✏️", name: "Stationery", text: "Useful everyday items" },
    { icon: "🏠", name: "Household", text: "Things that still matter" },
  ];

  const steps = [
    {
      number: "01",
      icon: "📦",
      title: "Share an Item",
      text: "List something useful that you no longer need.",
    },
    {
      number: "02",
      icon: "🙋",
      title: "Post a Need",
      text: "Tell the community what you are looking for.",
    },
    {
      number: "03",
      icon: "🤝",
      title: "Find a Connection",
      text: "Discover people and items that match your need.",
    },
    {
      number: "04",
      icon: "♻️",
      title: "Give It a New Life",
      text: "Turn unused things into meaningful help.",
    },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#faf9f5] text-[#193326]">
      {/* BACKGROUND DECOR */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-[#dcebdc] opacity-60 blur-3xl" />
        <div className="absolute -right-40 top-[420px] h-96 w-96 rounded-full bg-[#f5d8e2] opacity-50 blur-3xl" />
      </div>

      {/* ================= NAVBAR ================= */}
      <nav className="sticky top-0 z-50 border-b border-black/5 bg-[#faf9f5]/90 backdrop-blur-2xl">
        <div className="mx-auto flex h-[78px] max-w-7xl items-center justify-between px-5 md:px-8">
          {/* LOGO */}
          <Link
            href="/"
            onClick={closeMenu}
            className="group flex items-center gap-3"
          >
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-black/5 transition duration-300 group-hover:-rotate-3 group-hover:scale-105">
                <Image
                  src="/logo.png"
                  alt="Kaam Ka Saathi"
                  width={48}
                  height={48}
                  className="h-10 w-10 object-contain"
                />
              </div>

              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-[#c63868] ring-2 ring-[#faf9f5]" />
            </div>

            <div>
              <h1 className="text-lg font-black tracking-tight text-[#173d29] md:text-xl">
                Kaam Ka Saathi
              </h1>

              <p className="hidden text-[11px] font-medium text-gray-500 sm:block">
                Share • Help • Reuse
              </p>
            </div>
          </Link>

          {/* DESKTOP NAV */}
          <div className="hidden items-center gap-1 lg:flex">
            <a
              href="#home"
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#173d29] shadow-sm transition hover:-translate-y-0.5"
            >
              Home
            </a>

            <a
              href="#how"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-500 transition hover:bg-white hover:text-[#173d29]"
            >
              How It Works
            </a>

            <a
              href="#categories"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-500 transition hover:bg-white hover:text-[#173d29]"
            >
              Explore
            </a>

            <a
              href="#impact"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-500 transition hover:bg-white hover:text-[#173d29]"
            >
              Our Impact
            </a>
          </div>

          {/* DESKTOP ACTIONS */}
          <div className="hidden items-center gap-2 lg:flex">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2.5 text-sm font-bold text-[#173d29] transition hover:bg-white"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="rounded-xl bg-[#173d29] px-5 py-2.5 text-sm font-bold text-white shadow-lg transition duration-300 hover:-translate-y-0.5 hover:bg-[#24573b] hover:shadow-xl"
            >
              Join Free →
            </Link>
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-white text-xl text-[#173d29] shadow-sm transition hover:scale-105 lg:hidden"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* MOBILE MENU */}
        {menuOpen && (
          <div className="border-t border-black/5 bg-white/95 px-5 pb-5 pt-3 shadow-xl lg:hidden">
            <div className="space-y-1">
              <a
                href="#home"
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-xl px-4 py-3 font-bold hover:bg-[#f7f8f4]"
              >
                🏠 Home
              </a>

              <a
                href="#how"
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-xl px-4 py-3 font-bold hover:bg-[#f7f8f4]"
              >
                ⚙️ How It Works
              </a>

              <a
                href="#categories"
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-xl px-4 py-3 font-bold hover:bg-[#f7f8f4]"
              >
                📦 Explore
              </a>

              <a
                href="#impact"
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-xl px-4 py-3 font-bold hover:bg-[#f7f8f4]"
              >
                💚 Our Impact
              </a>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                href="/login"
                onClick={closeMenu}
                className="rounded-xl border border-[#173d29] py-3 text-center font-bold text-[#173d29]"
              >
                Login
              </Link>

              <Link
                href="/register"
                onClick={closeMenu}
                className="rounded-xl bg-[#173d29] py-3 text-center font-bold text-white"
              >
                Join Free →
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ================= HERO ================= */}
      <section id="home" className="relative">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-14 pt-12 md:px-8 md:pt-20 lg:grid-cols-[1.05fr_.95fr] lg:pb-20 lg:pt-24">
          {/* HERO TEXT */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d9e7d8] bg-[#edf5eb] px-4 py-2 text-sm font-bold text-[#356b45] shadow-sm">
              <span className="animate-pulse">●</span>
              A community built around sharing
            </div>

            <h2 className="mt-7 text-[clamp(2.8rem,6vw,5.5rem)] font-black leading-[0.97] tracking-[-0.05em] text-[#173d29]">
              What you don&apos;t need
              <span className="mt-2 block text-[#c63868]">
                may be exactly what someone needs.
              </span>
            </h2>

            <p className="mt-7 max-w-2xl text-base leading-7 text-gray-600 md:text-lg md:leading-8">
              Kaam Ka Saathi connects people with useful items, genuine needs,
              and opportunities to help — making reuse simple, local and
              meaningful.
            </p>

            {/* CTA BUTTONS */}
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="group rounded-2xl bg-[#173d29] px-7 py-4 text-center font-bold text-white shadow-xl shadow-[#173d29]/20 transition duration-300 hover:-translate-y-1 hover:bg-[#24573b] hover:shadow-2xl"
              >
                Start Sharing
                <span className="ml-2 inline-block transition group-hover:translate-x-1">
                  →
                </span>
              </Link>

              <Link
                href="/items"
                className="rounded-2xl border border-[#d9ddd6] bg-white px-7 py-4 text-center font-bold text-[#173d29] shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#173d29] hover:shadow-lg"
              >
                Explore Items
              </Link>
            </div>

            {/* TRUST POINTS */}
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm text-gray-500">
              <span>✓ Easy to use</span>
              <span>✓ Community focused</span>
              <span>✓ Built for reuse</span>
            </div>
          </div>

          {/* HERO VISUAL */}
          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#dcebdc] blur-3xl md:h-96 md:w-96" />

            {/* MAIN CARD */}
            <div className="relative rounded-[2.5rem] border border-white bg-white/80 p-5 shadow-[0_30px_80px_rgba(23,61,41,0.14)] backdrop-blur-xl md:p-7">
              <div className="relative overflow-hidden rounded-[2rem] bg-[#f1eee6] p-8 md:p-10">
                <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#dcebdc]" />

                <div className="absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-[#f5d7e1]" />

                <div className="relative flex justify-center">
                  <Image
                    src="/logo.png"
                    alt="Kaam Ka Saathi"
                    width={430}
                    height={430}
                    className="h-auto w-full max-w-[330px] object-contain drop-shadow-xl transition duration-700 hover:scale-105"
                    priority
                  />
                </div>

                <div className="relative mt-4 rounded-2xl bg-white/90 p-4 text-center shadow-sm backdrop-blur">
                  <p className="text-sm font-black text-[#173d29]">
                    ♻️ One item. One connection. One more chance.
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Turning unused things into useful moments.
                  </p>
                </div>
              </div>
            </div>

            {/* FLOATING BOOK CARD */}
            <div className="absolute -left-3 top-8 hidden animate-[bounce_4s_ease-in-out_infinite] rounded-2xl bg-white p-3 shadow-xl ring-1 ring-black/5 sm:block md:-left-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf5eb] text-2xl">
                  📚
                </div>

                <div>
                  <p className="text-xs text-gray-400">Shared</p>
                  <p className="text-sm font-black text-[#173d29]">Books</p>
                </div>
              </div>
            </div>

            {/* FLOATING CLOTHES CARD */}
            <div className="absolute -right-3 top-20 hidden rounded-2xl bg-white p-3 shadow-xl ring-1 ring-black/5 sm:block md:-right-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff0f4] text-2xl">
                  👕
                </div>

                <div>
                  <p className="text-xs text-gray-400">Giving away</p>
                  <p className="text-sm font-black text-[#173d29]">Clothes</p>
                </div>
              </div>
            </div>

            {/* FLOATING MATCH CARD */}
            <div className="absolute -bottom-5 left-5 hidden rounded-2xl bg-[#173d29] px-5 py-4 text-white shadow-xl sm:block md:left-0">
              <p className="text-xs text-green-100">Community connection</p>
              <p className="mt-1 text-lg font-black">
                Need → Item → Help ❤️
              </p>
            </div>

            {/* FLOATING PURPOSE CARD */}
            <div className="absolute -bottom-5 right-5 hidden rounded-2xl bg-white px-5 py-4 shadow-xl ring-1 ring-black/5 sm:block md:right-0">
              <p className="text-xs text-gray-400">Our purpose</p>
              <p className="mt-1 font-black text-[#c63868]">
                Less waste. More help.
              </p>
            </div>
          </div>
        </div>

        {/* ================= STATS ================= */}
        <div className="mx-auto max-w-7xl px-5 pb-14 md:px-8">
          <div className="grid overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-lg shadow-black/5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["120+", "Items Reused", "♻️"],
              ["85+", "People Connected", "🤝"],
              ["52", "Books Shared", "📚"],
              ["18", "Families Helped", "❤️"],
            ].map(([number, label, icon], index) => (
              <div
                key={label}
                className={`flex items-center gap-4 p-6 transition hover:bg-[#faf9f5] ${
                  index !== 0
                    ? "border-t border-black/5 sm:border-l sm:border-t-0"
                    : ""
                }`}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#edf5eb] text-xl">
                  {icon}
                </div>

                <div>
                  <p className="text-2xl font-black text-[#173d29]">
                    {number}
                  </p>

                  <p className="text-xs font-medium text-gray-500">
                    {label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PROBLEM ================= */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-5 text-center md:px-8">
          <span className="rounded-full bg-[#fff0f4] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#c63868]">
            The idea
          </span>

          <h2 className="mx-auto mt-6 max-w-4xl text-4xl font-black leading-tight tracking-tight text-[#173d29] md:text-5xl">
            The problem isn&apos;t always{" "}
            <span className="text-[#c63868]">lack of resources.</span>
            <br className="hidden md:block" />
            Sometimes, it&apos;s lack of connection.
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-gray-600 md:text-lg">
            A perfectly usable book can sit forgotten on one shelf while
            another student searches for the same book. A bag, toy, chair or
            electronic device may no longer be useful to one person — but
            could be valuable to someone nearby.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {["Unused", "Unneeded", "Forgotten"].map((word) => (
              <span
                key={word}
                className="rounded-full border border-gray-200 bg-[#faf9f5] px-4 py-2 text-sm font-semibold text-gray-500"
              >
                {word}
              </span>
            ))}

            <span className="px-2 py-2 font-black text-[#c63868]">→</span>

            {["Useful", "Needed", "Shared"].map((word) => (
              <span
                key={word}
                className="rounded-full bg-[#edf5eb] px-4 py-2 text-sm font-bold text-[#356b45]"
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section id="how" className="bg-[#faf9f5] py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="rounded-full bg-[#fff0f4] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#c63868]">
              How it works
            </span>

            <h2 className="mt-6 text-4xl font-black tracking-tight text-[#173d29] md:text-5xl">
              From unused to useful.
            </h2>

            <p className="mt-5 leading-7 text-gray-600">
              Four simple steps to turn everyday resources into community
              connections.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div
                key={step.number}
                className="group relative overflow-hidden rounded-[2rem] border border-black/5 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
              >
                <div className="absolute right-5 top-3 text-6xl font-black text-[#f3f1eb] transition group-hover:text-[#edf5eb]">
                  {step.number}
                </div>

                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf5eb] text-2xl transition duration-300 group-hover:rotate-3 group-hover:scale-110">
                    {step.icon}
                  </div>

                  <h3 className="mt-6 text-xl font-black text-[#173d29]">
                    {step.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-gray-500">
                    {step.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CATEGORIES ================= */}
      <section id="categories" className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <span className="rounded-full bg-[#edf5eb] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#356b45]">
                Explore
              </span>

              <h2 className="mt-6 text-4xl font-black tracking-tight text-[#173d29] md:text-5xl">
                Something useful for everyone.
              </h2>
            </div>

            <Link
              href="/items"
              className="font-bold text-[#c63868] transition hover:translate-x-1"
            >
              Explore all items →
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
            {categories.map((item) => (
              <div
                key={item.name}
                className="group relative overflow-hidden rounded-[1.7rem] border border-[#ece9e1] bg-[#faf9f5] p-6 transition duration-300 hover:-translate-y-2 hover:bg-white hover:shadow-xl"
              >
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white opacity-60 transition duration-500 group-hover:scale-150" />

                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm transition duration-300 group-hover:scale-110">
                    {item.icon}
                  </div>

                  <h3 className="mt-5 font-black text-[#173d29]">
                    {item.name}
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= SMART MATCHING ================= */}
      <section className="bg-[#173d29] py-20 text-white md:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 md:px-8 lg:grid-cols-2">
          <div>
            <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#f3a3bd]">
              Smart community
            </span>

            <h2 className="mt-6 text-4xl font-black leading-tight md:text-5xl">
              The right item can find the right person.
            </h2>

            <p className="mt-6 max-w-xl leading-8 text-green-100/80">
              Kaam Ka Saathi brings shared items and community needs together
              so useful resources have a better chance of reaching someone who
              actually needs them.
            </p>

            <div className="mt-8 space-y-3">
              {[
                "Category-based discovery",
                "Community needs",
                "Local connections",
                "Interest-based matching",
              ].map((text) => (
                <div
                  key={text}
                  className="flex items-center gap-3 text-sm font-semibold text-green-50"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[#f3a3bd]">
                    ✓
                  </span>

                  {text}
                </div>
              ))}
            </div>

            <Link
              href="/items"
              className="mt-9 inline-block rounded-2xl bg-[#c63868] px-7 py-4 font-bold text-white shadow-xl transition duration-300 hover:-translate-y-1 hover:bg-[#d64b79]"
            >
              Discover Items →
            </Link>
          </div>

          {/* MATCH CARD */}
          <div className="relative">
            <div className="absolute -inset-6 rounded-[3rem] bg-[#c63868]/10 blur-2xl" />

            <div className="relative rounded-[2.5rem] bg-white p-6 text-gray-800 shadow-2xl md:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Potential Match
                  </p>

                  <h3 className="mt-2 text-xl font-black text-[#173d29]">
                    BCA Programming Books
                  </h3>
                </div>

                <div className="rounded-full bg-[#edf5eb] px-3 py-2 text-sm font-black text-[#356b45]">
                  92%
                </div>
              </div>

              <div className="mt-7 rounded-2xl bg-[#faf9f5] p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
                    📚
                  </div>

                  <div>
                    <p className="font-black text-[#173d29]">
                      Programming Books
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Available in your community
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {[
                  "Category matches",
                  "Need is relevant",
                  "Nearby locality",
                  "Suitable condition",
                ].map((text) => (
                  <div
                    key={text}
                    className="rounded-xl border border-gray-100 bg-white p-3 text-xs font-semibold text-gray-600"
                  >
                    <span className="mr-2 text-[#356b45]">✓</span>
                    {text}
                  </div>
                ))}
              </div>

              <Link
                href="/items"
                className="mt-6 block rounded-xl bg-[#173d29] py-3.5 text-center text-sm font-bold text-white transition hover:bg-[#24573b]"
              >
                View Available Items
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= IMPACT ================= */}
      <section id="impact" className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="rounded-[2.5rem] bg-[#f1eee6] p-7 md:p-12">
            <div className="text-center">
              <span className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#c63868]">
                Our impact
              </span>

              <h2 className="mt-6 text-4xl font-black text-[#173d29] md:text-5xl">
                Small actions. Real impact.
              </h2>

              <p className="mx-auto mt-4 max-w-2xl text-gray-600">
                Every item shared is one more resource kept useful and one more
                opportunity created for someone in the community.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["120+", "Items Reused", "♻️"],
                ["85+", "People Connected", "🤝"],
                ["52", "Books Shared", "📚"],
                ["18", "Families Helped", "❤️"],
              ].map(([number, label, icon]) => (
                <div
                  key={label}
                  className="group rounded-[1.7rem] bg-white p-7 text-center shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl"
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf5eb] text-xl transition group-hover:scale-110">
                    {icon}
                  </div>

                  <p className="mt-5 text-3xl font-black text-[#173d29]">
                    {number}
                  </p>

                  <p className="mt-2 text-sm font-medium text-gray-500">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="relative overflow-hidden bg-white pb-24 pt-8">
        <div className="mx-auto max-w-5xl px-5 md:px-8">
          <div className="relative overflow-hidden rounded-[2.7rem] bg-[#173d29] px-7 py-14 text-center text-white shadow-2xl md:px-14 md:py-20">
            <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-[#c63868]/20 blur-2xl" />

            <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-white/5 blur-2xl" />

            <div className="relative">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-3xl backdrop-blur">
                ♻️
              </div>

              <h2 className="mx-auto mt-7 max-w-3xl text-4xl font-black leading-tight md:text-5xl">
                Your unused things could become someone else&apos;s useful
                things.
              </h2>

              <p className="mx-auto mt-5 max-w-2xl leading-7 text-green-100/80">
                Join a community where sharing is simple, help is local, and
                every useful item gets another chance.
              </p>

              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="rounded-2xl bg-white px-7 py-4 font-black text-[#173d29] shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  Create Free Account →
                </Link>

                <Link
                  href="/login"
                  className="rounded-2xl border border-white/20 bg-white/10 px-7 py-4 font-bold text-white backdrop-blur transition hover:bg-white/15"
                >
                  Already a member? Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-black/5 bg-[#faf9f5]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-9 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Kaam Ka Saathi"
              width={42}
              height={42}
              className="h-10 w-10 object-contain"
            />

            <div>
              <p className="font-black text-[#173d29]">Kaam Ka Saathi</p>

              <p className="text-xs text-gray-500">
                Share • Help • Reuse
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500">
            आपके पास बेकार नहीं, किसी के लिए उपहार है! ♻️
          </p>

          <p className="text-xs text-gray-400">© 2026 Kaam Ka Saathi</p>
        </div>
      </footer>
    </main>
  );
}