
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">(
    "error"
  );

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    const value = identifier.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    try {
      let loginData;

      if (isEmail) {
        // Login with email
        loginData = await supabase.auth.signInWithPassword({
          email: value.toLowerCase(),
          password,
        });
      } else {
        // Login with Indian mobile number
        const digits = value.replace(/\D/g, "");

        let phone = "";

        if (/^\d{10}$/.test(digits)) {
          phone = `+91${digits}`;
        } else if (/^91\d{10}$/.test(digits)) {
          phone = `+${digits}`;
        } else if (/^\d{12}$/.test(digits) && digits.startsWith("91")) {
          phone = `+${digits}`;
        }

        if (!phone) {
          setMessage(
            "Enter a valid email address or a 10-digit Indian mobile number."
          );
          setMessageType("error");
          return;
        }

        loginData = await supabase.auth.signInWithPassword({
          phone,
          password,
        });
      }

      const { data, error } = loginData;

      if (error) {
        setMessage(
          "Login failed. Please check your details and try again."
        );
        setMessageType("error");
        return;
      }

      const user = data.user;

      if (!user) {
        setMessage("We couldn't verify your account. Please try again.");
        setMessageType("error");
        return;
      }

      // Get the existing profile role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile role error:", profileError);
        setMessage(
          "You are logged in, but your profile could not be loaded. Please try again."
        );
        setMessageType("error");
        return;
      }

      setMessage("Login successful! Redirecting...");
      setMessageType("success");

      if (profile?.role === "admin") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/dashboard");
      }

      router.refresh();
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Something went wrong. Please try again.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f7f2] px-4 py-10">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-green-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-pink-200/40 blur-3xl" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white bg-white shadow-2xl md:grid-cols-2">
        {/* Left branding panel */}
        <section className="relative hidden flex-col justify-between overflow-hidden bg-[#173d29] p-10 text-white md:flex lg:p-12">
          <div className="absolute -right-20 top-24 h-64 w-64 rounded-full border border-white/10" />
          <div className="absolute -right-8 top-36 h-40 w-40 rounded-full border border-white/10" />
          <div className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-white/5" />

          <div className="relative">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl">
                ♻️
              </span>
              <span className="text-xl font-extrabold tracking-tight">
                Kaam Ka Sathi
              </span>
            </Link>

            <div className="mt-20">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-green-200">
                Share more. Waste less.
              </p>

              <h1 className="mt-5 text-4xl font-black leading-tight lg:text-5xl">
                Good things
                <br />
                deserve a
                <br />
                second chance.
              </h1>

              <p className="mt-6 max-w-sm leading-7 text-green-100/80">
                Find useful things, share what you no longer need, and connect
                with people in your community.
              </p>
            </div>
          </div>

          <div className="relative mt-12 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
            <p className="text-sm leading-6 text-green-50">
              “One person's unused item can become another person's
              everyday essential.”
            </p>
            <p className="mt-3 text-xs font-bold uppercase tracking-wider text-green-200">
              Your community. Your impact.
            </p>
          </div>
        </section>

        {/* Login form */}
        <section className="flex flex-col justify-center px-6 py-10 sm:px-10 md:px-10 lg:px-14">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 self-start text-sm font-semibold text-gray-500 transition hover:text-[#173d29] md:hidden"
          >
            <span className="text-xl">♻️</span>
            Kaam Ka Sathi
          </Link>

          <div className="mb-8">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e7efe8] text-2xl">
              👋
            </div>

            <p className="text-sm font-bold uppercase tracking-widest text-[#c63868]">
              Welcome back
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight text-[#173d29] sm:text-4xl">
              Login to your account
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              Continue connecting, sharing and discovering with your community.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="identifier"
                className="mb-2 block text-sm font-bold text-gray-700"
              >
                Email address or mobile number
              </label>

              <div className="flex items-center rounded-xl border border-gray-200 bg-white transition focus-within:border-[#173d29] focus-within:ring-4 focus-within:ring-[#173d29]/10">
                <span className="pl-4 text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 6 9-6" />
                  </svg>
                </span>

                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Email or 10-digit mobile number"
                  autoComplete="username"
                  required
                  className="w-full rounded-xl bg-transparent px-3 py-4 text-sm text-gray-900 outline-none placeholder:text-gray-400"
                />
              </div>

              <p className="mt-2 text-xs text-gray-400">
                Use the email or verified mobile number linked to your account.
              </p>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  htmlFor="password"
                  className="text-sm font-bold text-gray-700"
                >
                  Password
                </label>

                <Link
                  href="/forgot-password"
                  className="text-xs font-bold text-[#c63868] transition hover:text-[#a82e56] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="flex items-center rounded-xl border border-gray-200 bg-white transition focus-within:border-[#173d29] focus-within:ring-4 focus-within:ring-[#173d29]/10">
                <span className="pl-4 text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="4" y="10" width="16" height="11" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                </span>

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-xl bg-transparent px-3 py-4 text-sm text-gray-900 outline-none placeholder:text-gray-400"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="px-4 text-xs font-bold text-gray-500 transition hover:text-[#173d29]"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#173d29] px-5 py-4 font-bold text-white shadow-lg shadow-green-950/10 transition hover:-translate-y-0.5 hover:bg-[#24573b] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Signing you in...
                </>
              ) : (
                <>
                  Login securely
                  <span aria-hidden="true">→</span>
                </>
              )}
            </button>
          </form>

          {message && (
            <div
              role="status"
              aria-live="polite"
              className={`mt-5 rounded-xl border p-3 text-sm ${
                messageType === "success"
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs font-medium text-gray-400">
              NEW TO KAAM KA SATHI?
            </span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <Link
            href="/register"
            className="flex w-full items-center justify-center rounded-xl border-2 border-[#173d29]/15 px-5 py-3.5 text-sm font-bold text-[#173d29] transition hover:border-[#173d29] hover:bg-[#f4f8f4]"
          >
            Create your account
          </Link>

          <p className="mt-7 text-center text-xs leading-5 text-gray-400">
            By continuing, you agree to use Kaam Ka Sathi responsibly and
            respectfully.
          </p>

          <Link
            href="/"
            className="mt-5 text-center text-sm font-semibold text-gray-500 transition hover:text-[#173d29]"
          >
            ← Back to home
          </Link>
        </section>
      </div>
    </main>
  );
}
