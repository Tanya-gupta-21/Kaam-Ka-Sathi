"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function NewItemPage() {
const supabase = createClient();
const router = useRouter();

const [title, setTitle] = useState("");
const [description, setDescription] = useState("");
const [category, setCategory] = useState("");
const [condition, setCondition] = useState("");
const [city, setCity] = useState("");
const [locality, setLocality] = useState("");
const [loading, setLoading] = useState(false);
const [message, setMessage] = useState("");

useEffect(() => {
async function loadUser() {
const {
data: { user },
} = await supabase.auth.getUser();


  if (!user) {
    router.push("/login");
  }
}

loadUser();


}, [router, supabase]);

async function handleSubmit(e: FormEvent<HTMLFormElement>) {
e.preventDefault();


setLoading(true);
setMessage("");

const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) {
  setMessage("Please login first.");
  setLoading(false);
  router.push("/login");
  return;
}

const { error } = await supabase.from("items").insert({
  owner_id: user.id,
  title,
  description,
  category,
  condition,
  city,
  locality,
});

if (error) {
  console.error("Item insert error:", error);
  setMessage(error.message);
  setLoading(false);
  return;
}

setMessage("Item listed successfully! 🎉");

setLoading(false);

setTimeout(() => {
  router.push("/items");
  router.refresh();
}, 1200);


}

return ( <main className="min-h-screen bg-[#faf9f5] p-6"> <div className="mx-auto max-w-2xl">
<button
onClick={() => router.push("/dashboard")}
className="mb-6 text-sm font-semibold text-[#173d29] hover:underline"
>
← Back to Dashboard </button>


    <div className="rounded-3xl bg-white p-8 shadow-lg">
      <h1 className="text-3xl font-bold text-[#173d29]">
        List an Item 📦
      </h1>

      <p className="mt-2 text-gray-600">
        Give something useful a second chance.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="mb-2 block text-sm font-semibold">
            Item Name
          </label>

          <input
            type="text"
            placeholder="Example: BCA Programming Books"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#173d29]"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">
            Description
          </label>

          <textarea
            placeholder="Tell us about the item..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#173d29]"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">
            Category
          </label>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-[#173d29]"
          >
            <option value="">Select Category</option>
            <option value="Books">📚 Books</option>
            <option value="Clothes">👕 Clothes</option>
            <option value="Bags">🎒 Bags</option>
            <option value="Furniture">🪑 Furniture</option>
            <option value="Toys">🧸 Toys</option>
            <option value="Electronics">💻 Electronics</option>
            <option value="Stationery">✏️ Stationery</option>
            <option value="Household">🏠 Household</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">
            Condition
          </label>

          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            required
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-[#173d29]"
          >
            <option value="">Select Condition</option>
            <option value="Like New">Like New</option>
            <option value="Good">Good</option>
            <option value="Usable">Usable</option>
          </select>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold">
              City
            </label>

            <input
              type="text"
              placeholder="Example: Kanpur"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#173d29]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Locality
            </label>

            <input
              type="text"
              placeholder="Example: Swaroop Nagar"
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#173d29]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#173d29] px-5 py-3.5 font-semibold text-white hover:bg-[#24573b] disabled:opacity-50"
        >
          {loading ? "Listing Item..." : "List Item"}
        </button>
      </form>

      {message && (
        <p className="mt-5 rounded-xl bg-gray-100 p-4 text-sm text-gray-700">
          {message}
        </p>
      )}
    </div>
  </div>
</main>


);
}
