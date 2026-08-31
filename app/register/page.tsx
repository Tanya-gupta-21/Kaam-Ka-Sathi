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
    emailRedirectTo: "http://localhost:3000/login",
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

setMessage(
  "Registration successful! Please check your email and confirm your account."
);

setLoading(false);

setTimeout(() => {
  router.push("/login");
}, 2000);


}

return ( <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6"> <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg"> <h1 className="text-3xl font-bold text-gray-900">
Join Kaam Ka Sathi </h1>


    <p className="mt-2 text-gray-600">
      Give useful things a second life. ♻️
    </p>

    <form onSubmit={handleRegister} className="mt-6 space-y-4">
      <input
        type="text"
        placeholder="Full Name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
      />

      <input
        type="email"
        placeholder="Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
      />

      <input
        type="text"
        placeholder="City"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        required
        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
      />

      <input
        type="text"
        placeholder="Locality"
        value={locality}
        onChange={(e) => setLocality(e.target.value)}
        required
        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Creating Account..." : "Create Account"}
      </button>
    </form>

    {message && (
      <p className="mt-4 rounded-lg bg-gray-100 p-3 text-sm text-gray-700">
        {message}
      </p>
    )}

    <p className="mt-6 text-center text-sm text-gray-600">
      Already have an account?{" "}
      <a
        href="/login"
        className="font-semibold text-blue-600 hover:underline"
      >
        Login
      </a>
    </p>
  </div>
</main>


);
}
