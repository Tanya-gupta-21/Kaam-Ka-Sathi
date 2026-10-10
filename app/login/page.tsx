"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    // =========================
    // LOGIN
    // =========================

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    // =========================
    // CHECK LOGGED-IN USER
    // =========================

    const user = data.user;

    if (!user) {
      setMessage("Unable to get user information.");
      setLoading(false);
      return;
    }

    // =========================
    // GET USER ROLE
    // =========================

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Profile role error:", profileError);

      setMessage("Login successful, but profile information could not be loaded.");
      setLoading(false);
      return;
    }

    // =========================
    // ROLE BASED REDIRECT
    // =========================

    setMessage("Login successful! Redirecting...");

    if (profile?.role === "admin") {
      router.push("/admin/dashboard");
    } else {
      router.push("/dashboard");
    }

    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f4] p-6">
      <div className="w-full max-w-md rounded-[2rem] border border-gray-100 bg-white p-8 shadow-xl">
        {/* LOGO */}

        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#173d29] text-3xl shadow-lg">
            ♻️
          </div>

          <h1 className="text-3xl font-black text-[#173d29]">
            Welcome Back
          </h1>

          <p className="mt-2 text-gray-600">
            Login to Kaam Ka Saathi
          </p>
        </div>

        {/* LOGIN FORM */}

        <form onSubmit={handleLogin} className="mt-7 space-y-4">
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3.5 text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-[#173d29] focus:ring-4 focus:ring-[#173d29]/10"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3.5 text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-[#173d29] focus:ring-4 focus:ring-[#173d29]/10"
          />

          <div className="text-right">
            <a
              href="/forgot-password"
              className="text-sm font-bold text-[#c63868] hover:underline"
            >
              Forgot Password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[#173d29] px-4 py-3.5 font-black text-white transition hover:-translate-y-0.5 hover:bg-[#24573b] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* MESSAGE */}

        {message && (
          <p className="mt-4 rounded-2xl bg-gray-100 p-3 text-center text-sm text-gray-700">
            {message}
          </p>
        )}

        {/* REGISTER */}

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <a
            href="/register"
            className="font-bold text-[#c63868] hover:underline"
          >
            Create Account
          </a>
        </p>
      </div>
    </main>
  );
}