"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleReset(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setSuccess(false);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setMessage(
      "Password reset link has been sent to your email. Please check your inbox."
    );

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#f7f8f4] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-xl border border-gray-100">

        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#173d29] text-3xl">
            🔐
          </div>

          <h1 className="text-3xl font-black text-[#173d29]">
            Forgot Password?
          </h1>

          <p className="mt-2 text-gray-600">
            Enter your registered email and we'll send you a reset link.
          </p>
        </div>

        <form onSubmit={handleReset} className="mt-7 space-y-4">
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 outline-none transition focus:border-[#173d29] focus:bg-white focus:ring-4 focus:ring-[#173d29]/10"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[#173d29] px-4 py-3.5 font-black text-white transition hover:-translate-y-0.5 hover:bg-[#24573b] disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {message && (
          <p
            className={`mt-4 rounded-2xl p-4 text-center text-sm ${
              success
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-600"
            }`}
          >
            {message}
          </p>
        )}

        <div className="mt-6 text-center">
          <a
            href="/login"
            className="text-sm font-bold text-[#c63868] hover:underline"
          >
            ← Back to Login
          </a>
        </div>

      </div>
    </main>
  );
}