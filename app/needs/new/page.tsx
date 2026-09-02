"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const categories = [
  { name: "Books", icon: "📚" },
  { name: "Clothes", icon: "👕" },
  { name: "Bags", icon: "🎒" },
  { name: "Furniture", icon: "🪑" },
  { name: "Toys", icon: "🧸" },
  { name: "Electronics", icon: "💻" },
  { name: "Stationery", icon: "✏️" },
  { name: "Household", icon: "🏠" },
  { name: "Other", icon: "✨" },
];

const locations = {
  Kanpur: [
    "Swaroop Nagar",
    "Kakadeo",
    "Kalyanpur",
    "Kidwai Nagar",
    "Govind Nagar",
    "Barra",
    "Civil Lines",
    "Arya Nagar",
    "Shastri Nagar",
    "Other",
  ],
  Lucknow: [
    "Hazratganj",
    "Aliganj",
    "Gomti Nagar",
    "Indira Nagar",
    "Alambagh",
    "Mahanagar",
    "Other",
  ],
  Prayagraj: [
    "Civil Lines",
    "George Town",
    "Naini",
    "Allahpur",
    "Tagore Town",
    "Other",
  ],
  Unnao: [
    "Civil Lines",
    "Awas Vikas",
    "Shuklaganj",
    "Other",
  ],
};

export default function NewNeedPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [locality, setLocality] = useState("");
  const [customLocality, setCustomLocality] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setLoading(false);
    }

    checkUser();
  }, [router, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setMessage("");

    if (!title.trim()) {
      setMessage("Please enter what you need.");
      return;
    }

    if (!category) {
      setMessage("Please select a category.");
      return;
    }

    if (!city) {
      setMessage("Please select a city.");
      return;
    }

    const finalLocality =
      locality === "Other"
        ? customLocality.trim()
        : locality;

    if (!finalLocality) {
      setMessage("Please select or enter your locality.");
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("needs").insert({
      user_id: user.id,
      title: title.trim(),
      description: description.trim(),
      category,
      city,
      locality: finalLocality,
    });

    if (error) {
      console.error(error);
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setSaving(false);

    router.push("/dashboard/needs");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f4]">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 animate-pulse items-center justify-center rounded-[1.75rem] bg-[#e9f3eb] text-4xl">
            🙋
          </div>

          <p className="mt-4 font-medium text-gray-500">
            Preparing your request...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8f4] text-[#193326]">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 border-b border-[#e7e4dc] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="group text-left"
          >
            <div className="text-xl font-black tracking-tight text-[#173d29] transition group-hover:scale-[1.02] md:text-2xl">
              Kaam Ka Saathi{" "}
              <span className="inline-block transition group-hover:rotate-12">
                ♻️
              </span>
            </div>

            <p className="mt-0.5 text-xs text-gray-500 md:text-sm">
              Tell your community what you need
            </p>
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-xl border border-[#173d29] px-4 py-2.5 text-sm font-bold text-[#173d29] transition duration-300 hover:-translate-y-0.5 hover:bg-[#173d29] hover:text-white hover:shadow-md md:px-5"
          >
            ← <span className="hidden sm:inline">Dashboard</span>
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#c63868]/5 blur-3xl" />
        <div className="absolute -right-24 top-0 h-80 w-80 rounded-full bg-[#173d29]/5 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 pb-8 pt-12 md:px-6 md:pt-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_330px] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#f0d8e1] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#c63868] shadow-sm">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#c63868]" />
                POST A NEED
              </div>

              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-[#173d29] md:text-6xl">
                Tell us what
                <span className="text-[#c63868]"> you're looking for.</span>
                <span className="ml-2 inline-block animate-bounce">
                  🙋
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-gray-600 md:text-lg">
                Your community may already have what you need.
                Describe it clearly and give someone the chance to
                help.
              </p>
            </div>

            {/* SIDE CARD */}
            <div className="group rounded-[2rem] border border-[#e7e4dc] bg-white p-6 shadow-[0_15px_45px_rgba(23,61,41,0.08)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(23,61,41,0.12)]">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9f3eb] text-3xl transition duration-500 group-hover:rotate-6 group-hover:scale-110">
                💡
              </div>

              <h2 className="mt-5 text-xl font-black text-[#173d29]">
                A good request gets noticed.
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Add useful details like class, size, quantity or
                preferred condition so people know exactly how they
                can help.
              </p>

              <div className="mt-5 flex items-center gap-2 text-xs font-bold text-[#c63868]">
                <span>Be specific</span>
                <span>→</span>
                <span>Get better help</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FORM AREA */}
      <section className="mx-auto max-w-4xl px-5 pb-16 md:px-6">
        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-[2.5rem] border border-[#e7e4dc] bg-white shadow-[0_20px_60px_rgba(23,61,41,0.08)]"
        >
          {/* FORM HEADER */}
          <div className="border-b border-[#eeeae2] bg-[#faf9f5] px-6 py-6 md:px-9">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#173d29] text-xl text-white">
                📝
              </div>

              <div>
                <h2 className="font-black text-[#173d29]">
                  Your request
                </h2>

                <p className="text-sm text-gray-500">
                  A few details are all we need.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-9">
            {/* TITLE */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-black text-[#173d29]">
                  What do you need?
                  <span className="ml-1 text-[#c63868]">*</span>
                </label>

                <span className="text-xs text-gray-400">
                  {title.length}/100
                </span>
              </div>

              <input
                type="text"
                value={title}
                maxLength={100}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Example: Class 6 Science Books"
                className="w-full rounded-2xl border border-[#dedbd2] bg-[#faf9f5] px-5 py-4 text-sm font-medium outline-none transition duration-300 placeholder:text-gray-400 focus:border-[#173d29] focus:bg-white focus:ring-4 focus:ring-[#173d29]/10"
              />
            </div>

            {/* DESCRIPTION */}
            <div className="mt-7">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-black text-[#173d29]">
                  Tell us a little more
                </label>

                <span className="text-xs text-gray-400">
                  {description.length}/500
                </span>
              </div>

              <textarea
                value={description}
                maxLength={500}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Mention size, quantity, class, condition preference, or anything else that might help..."
                className="w-full resize-none rounded-2xl border border-[#dedbd2] bg-[#faf9f5] px-5 py-4 text-sm leading-6 outline-none transition duration-300 placeholder:text-gray-400 focus:border-[#173d29] focus:bg-white focus:ring-4 focus:ring-[#173d29]/10"
              />
            </div>

            {/* CATEGORY */}
            <div className="mt-7">
              <label className="mb-3 block text-sm font-black text-[#173d29]">
                What category is it?
                <span className="ml-1 text-[#c63868]">*</span>
              </label>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {categories.map((item) => {
                  const selected = category === item.name;

                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setCategory(item.name)}
                      className={`group rounded-2xl border p-3 text-center transition duration-300 ${
                        selected
                          ? "border-[#173d29] bg-[#e9f3eb] shadow-md"
                          : "border-[#e7e4dc] bg-white hover:-translate-y-1 hover:border-[#bfcfc4] hover:bg-[#faf9f5] hover:shadow-sm"
                      }`}
                    >
                      <span
                        className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl text-xl transition duration-300 ${
                          selected
                            ? "bg-white scale-110"
                            : "bg-[#f7f8f4] group-hover:scale-110"
                        }`}
                      >
                        {item.icon}
                      </span>

                      <span
                        className={`mt-2 block text-xs font-bold ${
                          selected
                            ? "text-[#173d29]"
                            : "text-gray-600"
                        }`}
                      >
                        {item.name}
                      </span>

                      {selected && (
                        <span className="mt-1 block text-[10px] font-black text-[#c63868]">
                          ✓ Selected
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* LOCATION */}
            <div className="mt-8">
              <div className="mb-3">
                <label className="text-sm font-black text-[#173d29]">
                  Where are you located?
                  <span className="ml-1 text-[#c63868]">*</span>
                </label>

                <p className="mt-1 text-xs text-gray-500">
                  This helps people nearby find your request.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {/* CITY */}
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                    City
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                      🏙️
                    </span>

                    <select
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        setLocality("");
                        setCustomLocality("");
                      }}
                      className="w-full appearance-none rounded-2xl border border-[#dedbd2] bg-[#faf9f5] py-4 pl-12 pr-10 text-sm font-medium outline-none transition duration-300 focus:border-[#173d29] focus:bg-white focus:ring-4 focus:ring-[#173d29]/10"
                    >
                      <option value="">Select city</option>

                      {Object.keys(locations).map((cityName) => (
                        <option
                          key={cityName}
                          value={cityName}
                        >
                          {cityName}
                        </option>
                      ))}
                    </select>

                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      ▼
                    </span>
                  </div>
                </div>

                {/* LOCALITY */}
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                    Locality
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                      📍
                    </span>

                    <select
                      value={locality}
                      onChange={(e) => {
                        setLocality(e.target.value);
                        setCustomLocality("");
                      }}
                      disabled={!city}
                      className="w-full appearance-none rounded-2xl border border-[#dedbd2] bg-[#faf9f5] py-4 pl-12 pr-10 text-sm font-medium outline-none transition duration-300 focus:border-[#173d29] focus:bg-white focus:ring-4 focus:ring-[#173d29]/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <option value="">
                        {city
                          ? "Select locality"
                          : "Select city first"}
                      </option>

                      {city &&
                        locations[
                          city as keyof typeof locations
                        ].map((localityName) => (
                          <option
                            key={localityName}
                            value={localityName}
                          >
                            {localityName}
                          </option>
                        ))}
                    </select>

                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      ▼
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CUSTOM LOCALITY */}
            {locality === "Other" && (
              <div className="mt-5 rounded-2xl border border-[#f0d8e1] bg-[#fff8fa] p-5">
                <label className="mb-2 block text-sm font-black text-[#173d29]">
                  Enter your locality
                  <span className="ml-1 text-[#c63868]">*</span>
                </label>

                <input
                  type="text"
                  value={customLocality}
                  onChange={(e) =>
                    setCustomLocality(e.target.value)
                  }
                  placeholder="Enter locality name"
                  className="w-full rounded-xl border border-[#ead7de] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#c63868] focus:ring-4 focus:ring-[#c63868]/10"
                />
              </div>
            )}

            {/* TIP */}
            <div className="mt-7 overflow-hidden rounded-[1.5rem] border border-[#e4e8df] bg-[#f1eee6]">
              <div className="flex gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                  💡
                </div>

                <div>
                  <p className="font-black text-[#173d29]">
                    Make your request useful
                  </p>

                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    Instead of just saying “I need books”, try
                    “Class 6 Science books in good condition”. Specific
                    details make it easier for someone to help.
                  </p>
                </div>
              </div>
            </div>

            {/* ERROR */}
            {message && (
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
                <span className="text-lg">⚠️</span>
                <span>{message}</span>
              </div>
            )}

            {/* ACTIONS */}
            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                disabled={saving}
                className="flex-1 rounded-2xl border border-[#dedbd2] px-6 py-4 font-bold text-gray-600 transition duration-300 hover:-translate-y-0.5 hover:bg-[#faf9f5] hover:shadow-sm disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="group flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#173d29] px-6 py-4 font-black text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-[#102d1f] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Posting your need...
                  </>
                ) : (
                  <>
                    Post My Need
                    <span className="transition duration-300 group-hover:translate-x-1">
                      🙋
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#e7e4dc] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-8 text-center md:flex-row md:items-center md:justify-between md:text-left">
          <div>
            <p className="font-black text-[#173d29]">
              Kaam Ka Saathi ♻️
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Your need could be someone else's opportunity to help.
            </p>
          </div>

          <p className="text-xs text-gray-400">
            Sharing more. Wasting less. Helping together.
          </p>
        </div>
      </footer>
    </main>
  );
}