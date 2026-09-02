"use client";

import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f8f4] px-6 text-[#173d29]">
      {/* Background decoration */}
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#c63868]/10 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-[#173d29]/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-2xl text-center">
        {/* Logo */}
        <div className="mx-auto mb-8 flex h-20 w-20 animate-bounce items-center justify-center rounded-[1.8rem] bg-[#173d29] text-4xl shadow-xl">
          ♻️
        </div>

        {/* 404 */}
        <div className="select-none text-[7rem] font-black leading-none tracking-tight text-[#173d29] sm:text-[9rem]">
          404
        </div>

        <div className="mx-auto mt-4 max-w-xl rounded-[2rem] border border-black/5 bg-white/80 p-8 shadow-xl backdrop-blur-xl sm:p-10">
          <div className="mb-4 inline-flex rounded-full bg-[#fff0f4] px-4 py-2 text-sm font-bold text-[#c63868]">
            Oops! Page not found
          </div>

          <h1 className="text-2xl font-black sm:text-3xl">
            This page took a little detour 🌱
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-gray-500 sm:text-base">
            The page you're looking for doesn't exist, may have been moved,
            or the link might be incorrect.
          </p>

          {/* Buttons */}
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-2xl bg-[#173d29] px-7 py-3.5 font-bold text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              🏠 Back to Dashboard
            </button>

            <button
              onClick={() => router.push("/items")}
              className="rounded-2xl border border-[#173d29]/10 bg-[#f1eee6] px-7 py-3.5 font-bold text-[#173d29] transition duration-300 hover:-translate-y-1 hover:bg-[#173d29] hover:text-white"
            >
              ♻️ Browse Items
            </button>
          </div>
        </div>

        {/* Branding */}
        <p className="mt-7 text-sm font-semibold text-gray-400">
          Kaam Ka Saathi
          <span className="mx-2">•</span>
          Share • Help • Reuse
        </p>
      </div>
    </main>
  );
}