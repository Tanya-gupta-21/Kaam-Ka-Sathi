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

const { error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

if (error) {
  setMessage(error.message);
  setLoading(false);
  return;
}

setMessage("Login successful! Redirecting...");

setLoading(false);

router.push("/dashboard");
router.refresh();


}

return ( <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6"> <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg"> <h1 className="text-3xl font-bold text-gray-900">
Welcome Back </h1>

```
    <p className="mt-2 text-gray-600">
      Login to Kaam Ka Sathi ♻️
    </p>

    <form onSubmit={handleLogin} className="mt-6 space-y-4">
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
        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[#173d29] px-4 py-3 font-semibold text-white hover:bg-[#24573b] disabled:opacity-50"
      >
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>

    {message && (
      <p className="mt-4 rounded-lg bg-gray-100 p-3 text-sm text-gray-700">
        {message}
      </p>
    )}

    <p className="mt-6 text-center text-sm text-gray-600">
      Don't have an account?{" "}
      <a
        href="/register"
        className="font-semibold text-blue-600 hover:underline"
      >
        Create Account
      </a>
    </p>
  </div>
</main>


);
}
