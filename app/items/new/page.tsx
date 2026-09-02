"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const cityLocalities: Record<string, string[]> = {
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

export default function NewItemPage() {
  const supabase = createClient();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [city, setCity] = useState("");
  const [locality, setLocality] = useState("");
  const [customLocality, setCustomLocality] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");

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

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage("Please select a valid image file.");
      setMessageType("error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image size should be less than 5 MB.");
      setMessageType("error");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setMessage("");
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview("");
  }

  function handleCityChange(value: string) {
    setCity(value);
    setLocality("");
    setCustomLocality("");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please login first.");
      setMessageType("error");
      setLoading(false);
      router.push("/login");
      return;
    }

    const finalLocality =
      locality === "Other" ? customLocality.trim() : locality;

    if (!city) {
      setMessage("Please select a city.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (!finalLocality) {
      setMessage("Please select or enter a locality.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    let imageUrl: string | null = null;

    try {
      /* --------------------------------
         Upload image if selected
      -------------------------------- */
      if (imageFile) {
        const fileExtension =
          imageFile.name.split(".").pop()?.toLowerCase() || "jpg";

        const fileName = `${user.id}-${Date.now()}.${fileExtension}`;

        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("item-images")
          .upload(filePath, imageFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: imageFile.type,
          });

        if (uploadError) {
          console.error("Image upload error:", uploadError);

          setMessage(
            "Image upload failed. Please check your Supabase Storage bucket settings."
          );
          setMessageType("error");
          setLoading(false);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from("item-images")
          .getPublicUrl(filePath);

        imageUrl = publicUrlData.publicUrl;
      }

      /* --------------------------------
         Insert item into database
      -------------------------------- */
      const { error: insertError } = await supabase.from("items").insert({
        owner_id: user.id,
        title: title.trim(),
        description: description.trim(),
        category,
        condition,
        city,
        locality: finalLocality,
        image_url: imageUrl,
      });

      if (insertError) {
        console.error("Item insert error:", insertError);

        setMessage(insertError.message);
        setMessageType("error");
        setLoading(false);
        return;
      }

      setMessage("Item listed successfully! 🎉");
      setMessageType("success");

      setTimeout(() => {
        router.push("/items");
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error(error);

      setMessage("Something went wrong. Please try again.");
      setMessageType("error");
      setLoading(false);
    }
  }

  const availableLocalities = city ? cityLocalities[city] || [] : [];

  return (
    <main className="min-h-screen bg-[#faf9f5] px-4 py-8 text-[#193326] sm:px-6">
      <div className="mx-auto max-w-2xl">
        {/* Back */}
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-6 text-sm font-semibold text-[#173d29] hover:underline"
        >
          ← Back to Dashboard
        </button>

        {/* Card */}
        <div className="rounded-3xl bg-white p-6 shadow-lg sm:p-8">
          <div>
            <p className="font-semibold text-[#c63868]">
              SHARE SOMETHING USEFUL
            </p>

            <h1 className="mt-2 text-3xl font-bold text-[#173d29]">
              List an Item 📦
            </h1>

            <p className="mt-2 text-gray-600">
              Give something useful a second chance.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {/* Item Name */}
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
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-[#173d29] focus:ring-2 focus:ring-[#e9f1e5]"
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Description
              </label>

              <textarea
                placeholder="Tell us about the item, its condition, and anything important..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={5}
                className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-[#173d29] focus:ring-2 focus:ring-[#e9f1e5]"
              />
            </div>

            {/* Category */}
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Category
              </label>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-[#173d29] focus:ring-2 focus:ring-[#e9f1e5]"
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

            {/* Condition */}
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Condition
              </label>

              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-[#173d29] focus:ring-2 focus:ring-[#e9f1e5]"
              >
                <option value="">Select Condition</option>
                <option value="Like New">Like New</option>
                <option value="Good">Good</option>
                <option value="Usable">Usable</option>
              </select>
            </div>

            {/* Product Image */}
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Product Photo 📷
              </label>

              {!imagePreview ? (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-[#faf9f5] px-6 py-10 text-center transition hover:border-[#173d29] hover:bg-[#f5f8f3]">
                  <div className="text-5xl">📷</div>

                  <p className="mt-3 font-semibold text-[#173d29]">
                    Upload Product Photo
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    JPG, PNG or WEBP • Maximum 5 MB
                  </p>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-gray-200">
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="h-64 w-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute right-3 top-3 rounded-full bg-white px-3 py-2 text-sm font-bold text-red-600 shadow-lg hover:bg-red-50"
                    >
                      ✕ Remove
                    </button>
                  </div>

                  <div className="p-4">
                    <p className="truncate text-sm font-semibold">
                      {imageFile?.name}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Photo ready to upload
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Location */}
            <div>
              <div className="mb-3">
                <label className="block text-sm font-semibold">
                  Location 📍
                </label>

                <p className="mt-1 text-xs text-gray-500">
                  Select where the item is available.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {/* City */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    City
                  </label>

                  <select
                    value={city}
                    onChange={(e) => handleCityChange(e.target.value)}
                    required
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-[#173d29] focus:ring-2 focus:ring-[#e9f1e5]"
                  >
                    <option value="">Select City</option>

                    <option value="Kanpur">Kanpur</option>
                    <option value="Lucknow">Lucknow</option>
                    <option value="Prayagraj">Prayagraj</option>
                    <option value="Unnao">Unnao</option>
                  </select>
                </div>

                {/* Locality */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Locality
                  </label>

                  <select
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    required
                    disabled={!city}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-[#173d29] focus:ring-2 focus:ring-[#e9f1e5] disabled:bg-gray-100 disabled:text-gray-400 focus:border-[#173d29] focus:ring-2 focus:ring-[#e9f1e5]"
                  >
                    <option value="">
                      {city ? "Select Locality" : "Select City First"}
                    </option>

                    {availableLocalities.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Custom Locality */}
              {locality === "Other" && (
                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium">
                    Enter Locality
                  </label>

                  <input
                    type="text"
                    placeholder="Example: Near ABC School"
                    value={customLocality}
                    onChange={(e) => setCustomLocality(e.target.value)}
                    required
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-[#173d29] focus:ring-2 focus:ring-[#e9f1e5]"
                  />
                </div>
              )}
            </div>

            {/* Message */}
            {message && (
              <div
                className={`rounded-xl p-4 text-sm ${
                  messageType === "success"
                    ? "bg-[#e9f1e5] text-[#356b45]"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {message}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#173d29] px-5 py-3.5 font-semibold text-white shadow-md transition hover:bg-[#24573b] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Uploading & Listing..." : "List Item ♻️"}
            </button>
          </form>
        </div>

        {/* Bottom note */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Your item could be exactly what someone else needs. 💚
        </p>
      </div>
    </main>
  );
}