"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <main className="min-h-screen bg-[#faf9f5] text-[#193326]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-[#e7e4dc] bg-[#faf9f5]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Kaam Ka Saathi"
              width={58}
              height={58}
              className="h-14 w-14 object-contain"
            />

            <div>
              <h1 className="text-xl font-bold text-[#173d29]">
                Kaam Ka Saathi
              </h1>

              <p className="text-xs text-gray-500">
                Giving useful things a second chance
              </p>
            </div>
          </div>

          {/* Desktop Navbar */}
          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#how"
              className="text-sm font-medium hover:text-[#c63868]"
            >
              How It Works
            </a>

            <a
              href="#categories"
              className="text-sm font-medium hover:text-[#c63868]"
            >
              Categories
            </a>

            <a
              href="#impact"
              className="text-sm font-medium hover:text-[#c63868]"
            >
              Our Impact
            </a>

            <Link
              href="/login"
              className="rounded-xl border border-[#c63868] px-5 py-2 text-sm font-semibold text-[#c63868] transition hover:bg-[#c63868] hover:text-white"
            >
              Login
            </Link>
          </div>

          {/* Mobile Menu */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Open menu"
            className="rounded-xl border border-gray-300 px-3 py-2 text-xl md:hidden"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-[#e7e4dc] bg-white px-6 py-5 shadow-lg md:hidden">
            <div className="flex flex-col gap-2">
              <a
                href="#how"
                onClick={closeMenu}
                className="rounded-xl px-4 py-3 font-medium hover:bg-[#faf9f5]"
              >
                ⚙️ How It Works
              </a>

              <a
                href="#categories"
                onClick={closeMenu}
                className="rounded-xl px-4 py-3 font-medium hover:bg-[#faf9f5]"
              >
                📦 Categories
              </a>

              <a
                href="#impact"
                onClick={closeMenu}
                className="rounded-xl px-4 py-3 font-medium hover:bg-[#faf9f5]"
              >
                💚 Our Impact
              </a>

              <Link
                href="/login"
                onClick={closeMenu}
                className="mt-2 rounded-xl bg-[#c63868] px-4 py-3 text-center font-semibold text-white"
              >
                🔐 Login
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-block rounded-full bg-[#e9f1e5] px-4 py-2 text-sm font-semibold text-[#356b45]">
              ♻️ Give • Share • Reuse
            </span>

            <h2 className="mt-6 text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
              Jo aapke kaam ka nahi,
              <span className="block text-[#c63868]">
                kisi aur ke kaam ka ho sakta hai.
              </span>
            </h2>

            <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600">
              Kaam Ka Sathi helps people find a useful second home for things
              they no longer need — and helps people find things they actually
              need.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/items/new"
                className="rounded-xl bg-[#173d29] px-7 py-3.5 font-semibold text-white shadow-lg transition hover:bg-[#24573b]"
              >
                I Have Something
              </Link>

              {/* FIXED: I Need Something now opens available items */}
              <Link
                href="/items"
                className="rounded-xl border border-[#173d29] bg-white px-7 py-3.5 font-semibold text-[#173d29] transition hover:bg-[#eef4ed]"
              >
                I Need Something
              </Link>
            </div>

            <p className="mt-6 text-sm text-gray-500">
              Your unused item could be exactly what someone else needs. 💚
            </p>
          </div>

          {/* Logo / Concept Card */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-gray-200">
                <Image
                  src="/logo.png"
                  alt="Kaam Ka Saathi Logo"
                  width={480}
                  height={480}
                  className="h-auto w-full max-w-md object-contain"
                  priority
                />
              </div>

              <div className="absolute -bottom-5 -left-5 rounded-2xl bg-white px-5 py-3 shadow-lg">
                <p className="text-sm font-bold text-[#173d29]">
                  ♻️ One item
                </p>

                <p className="text-xs text-gray-500">
                  One more chance to be useful
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="font-semibold text-[#c63868]">THE PROBLEM</p>

          <h2 className="mt-3 text-4xl font-bold">
            Useful things are often wasted simply because we don't know
            where they should go.
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-gray-600">
            Old books, clothes, bags, toys, furniture and other usable items
            often remain unused at home or get thrown away. At the same time,
            someone nearby may actually need them.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="bg-[#faf9f5] py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="font-semibold text-[#c63868]">HOW IT WORKS</p>

            <h2 className="mt-3 text-4xl font-bold">
              From unused to useful
            </h2>

            <p className="mt-4 text-gray-600">
              A simple way to connect things with people who need them.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: "📦",
                title: "List an Item",
                text: "Tell us about something useful that you no longer need.",
              },
              {
                icon: "🙋",
                title: "Find Something",
                text: "Browse useful items shared by people in your community.",
              },
              {
                icon: "🎯",
                title: "Find a Match",
                text: "Discover items that may fulfill what you are looking for.",
              },
              {
                icon: "♻️",
                title: "Give It a New Life",
                text: "Connect with the owner and help an item find a new home.",
              },
            ].map((step, index) => (
              <div
                key={step.title}
                className="rounded-2xl bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e9f1e5] text-xl font-bold">
                  {index + 1}
                </div>

                <div className="mt-5 text-4xl">{step.icon}</div>

                <h3 className="mt-4 text-xl font-bold">{step.title}</h3>

                <p className="mt-3 text-sm leading-6 text-gray-600">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <p className="font-semibold text-[#c63868]">
              WHAT CAN BE REUSED?
            </p>

            <h2 className="mt-3 text-4xl font-bold">
              Give everyday things another chance
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-5 md:grid-cols-4">
            {[
              ["📚", "Books"],
              ["👕", "Clothes"],
              ["🎒", "Bags"],
              ["🪑", "Furniture"],
              ["🧸", "Toys"],
              ["💻", "Electronics"],
              ["✏️", "Stationery"],
              ["🏠", "Household"],
            ].map(([icon, name]) => (
              <div
                key={name}
                className="rounded-2xl border border-[#ece9e1] bg-[#faf9f5] p-7 text-center transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="text-4xl">{icon}</div>
                <p className="mt-3 font-semibold">{name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Smart Matching */}
      <section className="bg-[#173d29] py-20 text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2">
          <div>
            <p className="font-semibold text-[#f3a3bd]">SMART MATCHING</p>

            <h2 className="mt-3 text-4xl font-bold">
              The right thing can reach the right person.
            </h2>

            <p className="mt-5 leading-8 text-green-100">
              Instead of making users search endlessly, Kaam Ka Saathi can
              compare an available item with posted requirements and identify
              potential matches.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 text-gray-800 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Potential Match</p>

                <h3 className="mt-1 text-xl font-bold">
                  BCA Programming Books
                </h3>
              </div>

              <div className="rounded-full bg-[#e9f1e5] px-4 py-2 font-bold text-[#356b45]">
                92% Match
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="rounded-xl bg-gray-50 p-4">
                ✓ Category matches
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                ✓ Requirement is relevant
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                ✓ Nearby locality
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                ✓ Suitable condition
              </div>
            </div>

            <Link
              href="/items"
              className="mt-6 block w-full rounded-xl bg-[#c63868] py-3 text-center font-semibold text-white transition hover:bg-[#a92e57]"
            >
              View Available Items
            </Link>
          </div>
        </div>
      </section>

      {/* Impact */}
      <section id="impact" className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-3xl bg-[#f1eee6] p-8 md:p-12">
            <div className="text-center">
              <p className="font-semibold text-[#c63868]">OUR IMPACT</p>

              <h2 className="mt-3 text-4xl font-bold">
                Every reuse counts.
              </h2>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-5 md:grid-cols-4">
              {[
                ["120+", "Items Reused"],
                ["85+", "People Connected"],
                ["52", "Books Shared"],
                ["18", "Families Helped"],
              ].map(([number, label]) => (
                <div
                  key={label}
                  className="rounded-2xl bg-white p-7 text-center"
                >
                  <p className="text-3xl font-extrabold text-[#173d29]">
                    {number}
                  </p>

                  <p className="mt-2 text-sm text-gray-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-white pb-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <Image
            src="/logo.png"
            alt="Kaam Ka Saathi"
            width={130}
            height={130}
            className="mx-auto"
          />

          <h2 className="mt-5 text-4xl font-bold">
            Kisi ki zarurat, kisi ki extra cheez se poori ho sakti hai.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-gray-600">
            Let's make reuse easier, more meaningful and more local.
          </p>

          <Link
            href="/register"
            className="mt-8 inline-block rounded-xl bg-[#c63868] px-8 py-3.5 font-semibold text-white shadow-lg transition hover:bg-[#a92e57]"
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e7e4dc] bg-[#faf9f5]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-gray-500 md:flex-row md:items-center md:justify-between">
          <p>© 2026 Kaam Ka Sathi</p>

          <p>
            आपके पास बेकार नहीं, किसी के लिए उपहार है! ♻️
          </p>
        </div>
      </footer>
    </main>
  );
}