
"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const supabase = createClient();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");
  const [locality, setLocality] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          city: city,
          locality: locality,
          role: "user",
        },
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Registration successful! You can now login. 🎉");

    setLoading(false);

    setTimeout(() => {
      router.push("/login");
    }, 1500);
  }

  return (
    <main className="min-h-screen bg-[#f7f8f4] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-xl border border-gray-100">

        {/* Logo / Heading */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#173d29] text-3xl shadow-lg">
            ♻️
          </div>

          <h1 className="text-3xl font-black text-[#173d29]">
            Join Kaam Ka Saathi
          </h1>

          <p className="mt-2 text-gray-600">
            Give useful things a second life. ♻️
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="mt-7 space-y-4">

          {/* Full Name */}
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3.5 text-gray-900 placeholder:text-gray-500 outline-none transition focus:border-[#173d29] focus:ring-4 focus:ring-[#173d29]/10"
          />

          {/* Email */}
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3.5 text-gray-900 placeholder:text-gray-500 outline-none transition focus:border-[#173d29] focus:ring-4 focus:ring-[#173d29]/10"
          />

          {/* Password */}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3.5 text-gray-900 placeholder:text-gray-500 outline-none transition focus:border-[#173d29] focus:ring-4 focus:ring-[#173d29]/10"
          />

          {/* City */}
          <input
            type="text"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            autoComplete="address-level2"
            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3.5 text-gray-900 placeholder:text-gray-500 outline-none transition focus:border-[#173d29] focus:ring-4 focus:ring-[#173d29]/10"
          />

          {/* Locality */}
          <input
            type="text"
            placeholder="Locality"
            value={locality}
            onChange={(e) => setLocality(e.target.value)}
            required
            autoComplete="address-line2"
            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3.5 text-gray-900 placeholder:text-gray-500 outline-none transition focus:border-[#173d29] focus:ring-4 focus:ring-[#173d29]/10"
          />

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[#173d29] px-4 py-3.5 font-black text-white transition hover:-translate-y-0.5 hover:bg-[#24573b] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {/* Message */}
        {message && (
          <p className="mt-4 rounded-2xl bg-gray-100 p-3 text-center text-sm text-gray-700">
            {message}
          </p>
        )}

        {/* Login Link */}
        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <a
            href="/login"
            className="font-bold text-[#c63868] hover:underline"
          >
            Login
          </a>
        </p>

      </div>
    </main>
  );
}
