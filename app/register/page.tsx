
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Stage = "details" | "otp";

export default function RegisterPage() {
  const supabase = createClient();
  const router = useRouter();

  const [stage, setStage] = useState<Stage>("details");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pendingPhone, setPendingPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [city, setCity] = useState("");
  const [locality, setLocality] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#173d29] focus:ring-4 focus:ring-[#173d29]/10";

  const labelClass = "mb-2 block text-sm font-bold text-gray-700";

  function showMessage(text: string, isSuccess = false) {
    setMessage(text);
    setSuccess(isSuccess);
  }

  async function sendPhoneOtp(phoneNumber: string) {
    const { error } = await supabase.auth.updateUser({
      phone: phoneNumber,
    });

    if (error) {
      console.error("Phone OTP request error:", error);
      showMessage(
        "Your account was created, but the OTP could not be sent. Check the Twilio/Supabase SMS configuration and try resending."
      );
      return false;
    }

    showMessage(
      `A verification code has been sent to +91 ${phoneNumber.slice(3)}.`,
      true
    );

    return true;
  }

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    const name = fullName.trim().replace(/\s+/g, " ");
    const normalizedEmail = email.trim().toLowerCase();
    const digits = phone.replace(/\D/g, "");
    const e164Phone = `+91${digits}`;

    if (name.length < 2) {
      showMessage("Please enter your full name.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      showMessage("Please enter a valid email address.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(digits)) {
      showMessage("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (password.length < 8) {
      showMessage("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      showMessage("Passwords do not match.");
      return;
    }

    if (!city.trim() || !locality.trim()) {
      showMessage("Please enter your city and locality.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: name,
            city: city.trim(),
            locality: locality.trim(),
            role: "user",
          },
        },
      });

      if (error) {
        console.error("Signup error:", error);
        showMessage(error.message);
        return;
      }

      if (!data.user) {
        showMessage("Account creation could not be confirmed. Please try again.");
        return;
      }

      // Phone verification requires an authenticated session for updateUser().
      if (!data.session) {
        showMessage(
          "Your account was created. Please sign in after completing any required email verification, then verify your phone."
        );
        return;
      }

      setPendingPhone(e164Phone);
      setStage("otp");

      await sendPhoneOtp(e164Phone);
    } catch (error) {
      console.error("Registration error:", error);
      showMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    const token = otp.trim();

    if (!/^\d{6}$/.test(token)) {
      showMessage("Enter the 6-digit verification code.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: pendingPhone,
        token,
        type: "phone_change",
      });

      if (error) {
        console.error("OTP verification error:", error);
        showMessage(
          "The code could not be verified. Check the code or request a new one."
        );
        return;
      }

      const userId = data.user?.id;

      if (!userId) {
        showMessage(
          "Phone verification could not be completed. Please sign in and try again."
        );
        return;
      }

      // Save the phone in the profile only after successful verification.
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ phone: pendingPhone })
        .eq("id", userId);

      if (profileError) {
        console.error("Profile phone update error:", profileError);
        showMessage(
          "Your phone was verified, but your profile could not be updated. Check the profiles table update policy before continuing."
        );
        return;
      }

      showMessage("Phone verified! Welcome to Kaam Ka Sathi.", true);
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Verification error:", error);
      showMessage("Something went wrong during verification.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    setMessage("");
    setLoading(true);

    try {
      // Retry the phone-change request for the same signed-in user.
      await sendPhoneOtp(pendingPhone);
    } catch (error) {
      console.error("Resend OTP error:", error);
      showMessage("Could not resend the code. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f7f2] px-4 py-8 sm:py-12">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-green-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-pink-200/40 blur-3xl" />

      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white bg-white shadow-2xl md:grid-cols-[0.85fr_1.15fr]">
        {/* Branding */}
        <section className="relative hidden flex-col justify-between overflow-hidden bg-[#173d29] p-10 text-white md:flex lg:p-12">
          <div className="absolute -right-16 top-24 h-64 w-64 rounded-full border border-white/10" />
          <div className="absolute -right-4 top-40 h-40 w-40 rounded-full border border-white/10" />
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
                Discover useful items, share what you no longer need, and
                connect with people in your community.
              </p>
            </div>
          </div>

          <div className="relative rounded-2xl border border-white/15 bg-white/10 p-5">
            <p className="text-sm leading-6 text-green-50">
              One person&apos;s unused item can become another person&apos;s everyday
              essential.
            </p>
            <p className="mt-3 text-xs font-bold uppercase tracking-wider text-green-200">
              Your community. Your impact.
            </p>
          </div>
        </section>

        {/* Form */}
        <section className="px-5 py-8 sm:px-9 sm:py-10 lg:px-12">
          <Link
            href="/"
            className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#173d29] md:hidden"
          >
            <span className="text-xl">♻️</span>
            Kaam Ka Sathi
          </Link>

          <div className="mb-7">
            <p className="text-sm font-bold uppercase tracking-widest text-[#c63868]">
              {stage === "details" ? "Join the community" : "Almost there"}
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight text-[#173d29] sm:text-4xl">
              {stage === "details" ? "Create your account" : "Verify your phone"}
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              {stage === "details"
                ? "Create your personal profile to connect with your community."
                : `Enter the 6-digit code sent to +91 ${pendingPhone.slice(3)}.`}
            </p>

            <div className="mt-6 flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  stage === "details"
                    ? "bg-[#173d29] text-white"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {stage === "otp" ? "✓" : "1"}
              </div>
              <div className="h-1 flex-1 rounded-full bg-gray-100">
                <div
                  className={`h-1 rounded-full bg-[#173d29] transition-all ${
                    stage === "otp" ? "w-full" : "w-0"
                  }`}
                />
              </div>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  stage === "otp"
                    ? "bg-[#173d29] text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                2
              </div>
            </div>
            <div className="mt-2 flex justify-between text-xs text-gray-400">
              <span>Your details</span>
              <span>Phone verification</span>
            </div>
          </div>

          {stage === "details" ? (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label htmlFor="fullName" className={labelClass}>
                  Full name *
                </label>
                <input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  maxLength={100}
                  required
                  className={inputClass}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="email" className={labelClass}>
                    Email address *
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className={labelClass}>
                    Mobile number *
                  </label>
                  <div className="flex overflow-hidden rounded-xl border border-gray-200 focus-within:border-[#173d29] focus-within:ring-4 focus-within:ring-[#173d29]/10">
                    <span className="flex items-center border-r border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-600">
                      +91
                    </span>
                    <input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                      }
                      placeholder="10-digit number"
                      autoComplete="tel-national"
                      maxLength={10}
                      required
                      className="w-full min-w-0 bg-white px-3 py-3.5 text-sm text-gray-900 outline-none placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="password" className={labelClass}>
                  Create password *
                </label>
                <div className="flex items-center rounded-xl border border-gray-200 focus-within:border-[#173d29] focus-within:ring-4 focus-within:ring-[#173d29]/10">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    className="w-full min-w-0 rounded-xl bg-transparent px-4 py-3.5 text-sm text-gray-900 outline-none placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((old) => !old)}
                    className="px-4 text-xs font-bold text-gray-500 hover:text-[#173d29]"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className={labelClass}>
                  Confirm password *
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  required
                  className={inputClass}
                />
              </div>

              <div className="border-t border-gray-100 pt-5">
                <h3 className="font-bold text-[#173d29]">Your location</h3>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Used to find relevant items and people near you.
                </p>

                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="city" className={labelClass}>
                      City *
                    </label>
                    <input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Kanpur"
                      autoComplete="address-level2"
                      maxLength={100}
                      required
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="locality" className={labelClass}>
                      Locality / area *
                    </label>
                    <input
                      id="locality"
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
                      placeholder="e.g. Kakadeo"
                      autoComplete="address-line2"
                      maxLength={150}
                      required
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#173d29] px-5 py-4 font-bold text-white shadow-lg shadow-green-950/10 transition hover:-translate-y-0.5 hover:bg-[#24573b] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating account..." : "Create account & send OTP →"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label htmlFor="otp" className={labelClass}>
                  6-digit verification code *
                </label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="Enter OTP"
                  maxLength={6}
                  required
                  className={`${inputClass} text-center text-2xl font-bold tracking-[0.5em]`}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#173d29] px-5 py-4 font-bold text-white transition hover:bg-[#24573b] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Verifying..." : "Verify phone & continue →"}
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="w-full rounded-xl border border-gray-200 px-5 py-3.5 text-sm font-bold text-[#173d29] transition hover:bg-gray-50 disabled:opacity-60"
              >
                Resend OTP
              </button>
            </form>
          )}

          {message && (
            <div
              role="status"
              aria-live="polite"
              className={`mt-5 rounded-xl border p-4 text-sm leading-6 ${
                success
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          <p className="mt-7 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-[#c63868] hover:underline"
            >
              Login
            </Link>
          </p>

          <Link
            href="/"
            className="mt-5 block text-center text-sm font-semibold text-gray-500 hover:text-[#173d29]"
          >
            ← Back to home
          </Link>
        </section>
      </div>
    </main>
  );
}
