
"use client";

import dynamic from "next/dynamic";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { MapLocation } from "@/app/components/LocationPicker";
import { resizeImageToBase64 } from "@/lib/imageResize";
import AiDraftAssistant from "@/components/AiDraftAssistant";

const LocationPicker = dynamic(
  () => import("@/app/components/LocationPicker"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[380px] items-center justify-center rounded-2xl bg-gray-100">
        Loading map...
      </div>
    ),
  }
);

type ListingMode = "give" | "sell" | "rent" | "lend";

const categories = [
  "Books",
  "Clothes",
  "Bags",
  "Furniture",
  "Toys",
  "Electronics",
  "Stationery",
  "Household",
  "Other",
];

const conditions = ["New", "Like New", "Good", "Fair", "Used"];

const initialPosition: MapLocation = {
  lat: 26.4499,
  lng: 80.3319,
};

type SearchResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    neighbourhood?: string;
    residential?: string;
    county?: string;
    state?: string;
  };
};

type PhotoCheck = {
  matches: boolean;
  confidence: "high" | "medium" | "low";
  detected: string;
  reason: string;
  suggested_title: string;
  suggested_category: string;
  inappropriate: boolean;
};

export default function NewItemPage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Books");
  const [condition, setCondition] = useState("Good");

  const [listingMode, setListingMode] = useState<ListingMode>("give");
  const [price, setPrice] = useState("");
  const [pricePeriod, setPricePeriod] = useState("day");
  const [durationDays, setDurationDays] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");

  const [city, setCity] = useState("Kanpur");
  const [locality, setLocality] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [position, setPosition] = useState<MapLocation>(initialPosition);

  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [gettingAddress, setGettingAddress] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [checkingPhoto, setCheckingPhoto] = useState(false);
  const [photoCheck, setPhotoCheck] = useState<PhotoCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">(
    "error"
  );

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  async function reverseGeocode(point: MapLocation) {
    setGettingAddress(true);

    try {
      const url = new URL(
        "https://nominatim.openstreetmap.org/reverse"
      );

      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("lat", String(point.lat));
      url.searchParams.set("lon", String(point.lng));
      url.searchParams.set("addressdetails", "1");

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error("Address lookup failed");
      }

      const result = await response.json();
      const address = result.address ?? {};

      const detectedCity =
        address.city ??
        address.town ??
        address.village ??
        address.county ??
        "";

      const detectedLocality =
        address.suburb ??
        address.neighbourhood ??
        address.residential ??
        "";

      setLocationAddress(result.display_name ?? "");
      setSearchText(result.display_name ?? "");
      setCity(detectedCity);
      setLocality(detectedLocality);
      setSearchResults([]);
    } catch {
      setLocationAddress("");
      setMessage(
        "Pin selected, but address lookup failed. Enter the city and locality manually."
      );
      setMessageType("error");
    } finally {
      setGettingAddress(false);
    }
  }

  async function searchLocation() {
    const query = searchText.trim();

    if (!query) {
      setMessage("Please enter an area, landmark or address.");
      setMessageType("error");
      return;
    }

    setSearching(true);
    setMessage("");
    setSearchResults([]);

    try {
      const url = new URL(
        "https://nominatim.openstreetmap.org/search"
      );

      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("q", query);
      url.searchParams.set("limit", "5");
      url.searchParams.set("addressdetails", "1");
      url.searchParams.set("countrycodes", "in");

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error("Location search failed");
      }

      const results: SearchResult[] = await response.json();

      if (!results.length) {
        setMessage("No location found. Try a different search.");
        setMessageType("error");
      } else {
        setSearchResults(results);
      }
    } catch {
      setMessage(
        "Location search is temporarily unavailable. You can select a point directly on the map."
      );
      setMessageType("error");
    } finally {
      setSearching(false);
    }
  }

  function selectSearchResult(result: SearchResult) {
    const point = {
      lat: Number(result.lat),
      lng: Number(result.lon),
    };

    setPosition(point);
    setLocationAddress(result.display_name);
    setSearchText(result.display_name);
    setSearchResults([]);

    const address = result.address ?? {};

    setCity(
      address.city ??
        address.town ??
        address.village ??
        address.county ??
        ""
    );

    setLocality(
      address.suburb ??
        address.neighbourhood ??
        address.residential ??
        ""
    );

    setMessage("");
  }

  async function handleImageChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please select a valid image.");
      setMessageType("error");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image size must be 5 MB or less.");
      setMessageType("error");
      event.target.value = "";
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setPhotoCheck(null);
    setMessage("");
  }

  async function checkItemPhoto() {
    if (!imageFile) return;
    setCheckingPhoto(true);
    setMessage("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }

      const image = await resizeImageToBase64(imageFile);
      const response = await fetch("/api/ai/check-photo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          image: image.data,
          mediaType: image.mediaType,
          title: title.trim(),
          category,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "AI photo check failed. Please try again.");
      }
      setPhotoCheck(result as PhotoCheck);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "AI photo check failed. Please try again.");
      setMessageType("error");
    } finally {
      setCheckingPhoto(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const cleanTitle = title.trim();
    const cleanCity = city.trim();
    const cleanLocality = locality.trim();

    if (!cleanTitle || !description.trim()) {
      setMessage("Please enter the item title and description.");
      setMessageType("error");
      return;
    }

    if (!cleanCity || !cleanLocality) {
      setMessage("Please enter both city and locality.");
      setMessageType("error");
      return;
    }

    if (!Number.isFinite(position.lat) || !Number.isFinite(position.lng)) {
      setMessage("Please select a valid location on the map.");
      setMessageType("error");
      return;
    }

    if (
      (listingMode === "sell" || listingMode === "rent") &&
      (price.trim() === "" ||
        !Number.isFinite(Number(price)) ||
        Number(price) < 0)
    ) {
      setMessage("Enter a valid price for this listing.");
      setMessageType("error");
      return;
    }

    if (
      (listingMode === "rent" || listingMode === "lend") &&
      durationDays.trim() !== "" &&
      (!Number.isInteger(Number(durationDays)) ||
        Number(durationDays) < 1 ||
        Number(durationDays) > 3650)
    ) {
      setMessage("Duration must be between 1 and 3650 days.");
      setMessageType("error");
      return;
    }

    if (
      listingMode === "rent" &&
      securityDeposit.trim() !== "" &&
      (!Number.isFinite(Number(securityDeposit)) ||
        Number(securityDeposit) < 0)
    ) {
      setMessage("Enter a valid security deposit.");
      setMessageType("error");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/login");
        return;
      }

      let imageUrl: string | null = null;

      if (imageFile) {
        const extension =
          imageFile.name.split(".").pop()?.toLowerCase() || "jpg";

        const filePath = `${user.id}/${user.id}-${Date.now()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("item-images")
          .upload(filePath, imageFile, {
            upsert: false,
            contentType: imageFile.type,
          });

        if (uploadError) {
          throw new Error(
            `Image upload failed: ${uploadError.message}`
          );
        }

        const { data: publicData } = supabase.storage
          .from("item-images")
          .getPublicUrl(filePath);

        imageUrl = publicData.publicUrl;
      }

      const { error: insertError } = await supabase
        .from("items")
        .insert({
          owner_id: user.id,
          title: cleanTitle,
          description: description.trim(),
          category,
          condition,
          city: cleanCity,
          locality: cleanLocality,
          image_url: imageUrl,
          listing_mode: listingMode,
          price:
            listingMode === "sell" || listingMode === "rent"
              ? Number(price)
              : null,
          price_period:
            listingMode === "rent" ? pricePeriod : null,
          duration_days:
            (listingMode === "rent" || listingMode === "lend") &&
            durationDays.trim() !== ""
              ? Number(durationDays)
              : null,
          security_deposit:
            listingMode === "rent" && securityDeposit.trim() !== ""
              ? Number(securityDeposit)
              : null,
          latitude: position.lat,
          longitude: position.lng,
          location_address: locationAddress || null,
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      setMessage("Your item has been listed successfully!");
      setMessageType("success");

      setTimeout(() => {
        router.push("/items");
        router.refresh();
      }, 900);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while listing your item."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

  const labelClass = "mb-2 block text-sm font-semibold text-gray-700";

  return (
    <main className="min-h-screen bg-[#f8f8f4] px-4 py-10 text-gray-900">
      <div className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 text-sm font-semibold text-emerald-800 hover:underline"
        >
          ← Go back
        </button>

        <header className="mb-8">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
            Kaam Ka Sathi
          </p>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            List an item
          </h1>
          <p className="mt-3 text-gray-600">
            Give something a second life. Sell it, rent it, lend it or
            give it away for free.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="motion-enter space-y-7 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8"
        >
          <section>
            <h2 className="mb-5 text-xl font-bold">Item details</h2>

            <div className="space-y-5">
              <div>
                <label className={labelClass}>Item title *</label>
                <input
                  className={inputClass}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setPhotoCheck(null);
                  }}
                  placeholder="e.g. Class 10 Mathematics Book"
                  maxLength={120}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Description *</label>
                <textarea
                  className={inputClass}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the item, its condition and anything the next person should know..."
                  rows={4}
                  maxLength={3000}
                  required
                />
              </div>

              <AiDraftAssistant
                task="item_draft"
                notes={[
                  title.trim() && "Title: " + title.trim(),
                  description.trim() && "Description: " + description.trim(),
                  (title.trim() || description.trim()) && "Condition: " + condition,
                  (title.trim() || description.trim()) && "Listing type: " + listingMode,
                ].filter(Boolean).join("\n")}
                category={category}
                onApply={(draft) => {
                  setTitle(draft.title);
                  setDescription(draft.description.slice(0, 3000));
                  setCategory(draft.category);
                  setPhotoCheck(null);
                }}
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Category *</label>
                  <select
                    className={inputClass}
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setPhotoCheck(null);
                    }}
                  >
                    {categories.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Condition *</label>
                  <select
                    className={inputClass}
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                  >
                    {conditions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Item photo (optional)</label>
                <input
                  className={`${inputClass} file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:font-semibold file:text-emerald-800`}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <p className="mt-2 text-xs text-gray-500">
                  Image formats supported by your browser; maximum 5 MB.
                </p>

                {imagePreview && (
                  <div className="mt-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Item preview"
                      className="h-56 w-full rounded-2xl border border-gray-200 object-cover sm:w-72"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview("");
                        setPhotoCheck(null);
                      }}
                      className="mt-2 text-sm font-semibold text-red-600 hover:underline"
                    >
                      Remove photo
                    </button>
                    <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                      <p className="text-sm font-bold text-[#173d29]">Optional AI photo check</p>
                      <p className="mt-1 text-xs leading-5 text-gray-600">
                        AI will identify the main object, compare it with your title/category, and suggest edits. It can make mistakes; please review the result yourself. A resized copy of this photo is sent to Gemini for analysis.
                      </p>
                      <button
                        type="button"
                        onClick={() => void checkItemPhoto()}
                        disabled={checkingPhoto}
                        className="mt-3 rounded-xl border border-[#173d29] px-4 py-2 text-sm font-bold text-[#173d29] disabled:opacity-50"
                      >
                        {checkingPhoto ? "Checking photo…" : photoCheck ? "Check again" : "Check with AI"}
                      </button>
                      {photoCheck && (
                        <div className="mt-3 rounded-xl bg-white p-3 text-sm" aria-live="polite">
                          <p className="font-bold">
                            {photoCheck.inappropriate
                              ? "Please review this photo before posting."
                              : photoCheck.matches
                                ? "The photo seems consistent with your listing."
                                : "The photo may not match your listing."}
                          </p>
                          <p className="mt-1 text-gray-600">AI sees: {photoCheck.detected || "unclear"}. Confidence: {photoCheck.confidence}.</p>
                          {photoCheck.reason && <p className="mt-1 text-gray-600">{photoCheck.reason}</p>}
                          {(photoCheck.suggested_title || photoCheck.suggested_category) && (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span className="text-xs text-gray-600">
                                Suggestion: {photoCheck.suggested_title || title || "Add a title"}
                                {photoCheck.suggested_category ? ` · ${photoCheck.suggested_category}` : ""}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (photoCheck.suggested_title) setTitle(photoCheck.suggested_title);
                                  if (categories.includes(photoCheck.suggested_category)) setCategory(photoCheck.suggested_category);
                                }}
                                className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-bold text-[#173d29]"
                              >
                                Apply suggestion
                              </button>
                            </div>
                          )}
                          <p className="mt-2 text-xs text-gray-500">This is guidance only. It does not verify ownership, condition, authenticity, or safety.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <hr className="border-gray-100" />

          <section>
            <h2 className="mb-2 text-xl font-bold">
              How do you want to list it?
            </h2>
            <p className="mb-5 text-sm text-gray-600">
              Choose how another person can use your item.
            </p>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                [
                  ["give", "🎁", "Give free"],
                  ["sell", "🛍️", "Sell"],
                  ["rent", "📅", "Rent"],
                  ["lend", "🤝", "Lend"],
                ] as [ListingMode, string, string][]
              ).map(([mode, emoji, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setListingMode(mode)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    listingMode === mode
                      ? "border-emerald-700 bg-emerald-50 ring-2 ring-emerald-100"
                      : "border-gray-200 hover:border-emerald-300"
                  }`}
                >
                  <span className="block text-2xl">{emoji}</span>
                  <span className="mt-2 block font-bold">{label}</span>
                  {listingMode === mode && (
                    <span className="mt-1 block text-xs text-emerald-800">
                      Selected
                    </span>
                  )}
                </button>
              ))}
            </div>

            {listingMode === "give" && (
              <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
                This item will be offered for free.
              </div>
            )}

            {listingMode === "sell" && (
              <div className="mt-5">
                <label className={labelClass}>Selling price (₹) *</label>
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Enter price in rupees"
                  required
                />
              </div>
            )}

            {listingMode === "rent" && (
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Rental price (₹) *</label>
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Enter rental price"
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>Price per *</label>
                  <select
                    className={inputClass}
                    value={pricePeriod}
                    onChange={(e) => setPricePeriod(e.target.value)}
                  >
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>
                    Security deposit (₹, optional)
                  </label>
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    step="0.01"
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(e.target.value)}
                    placeholder="e.g. 500"
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Rental duration in days (optional)
                  </label>
                  <input
                    className={inputClass}
                    type="number"
                    min="1"
                    max="3650"
                    step="1"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    placeholder="e.g. 7"
                  />
                </div>
              </div>
            )}

            {listingMode === "lend" && (
              <div className="mt-5">
                <label className={labelClass}>
                  Lending duration in days (optional)
                </label>
                <input
                  className={inputClass}
                  type="number"
                  min="1"
                  max="3650"
                  step="1"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  placeholder="e.g. 14"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Lending means letting someone borrow the item temporarily
                  without a rental fee.
                </p>
              </div>
            )}
          </section>

          <hr className="border-gray-100" />

          <section>
            <h2 className="mb-2 text-xl font-bold">Item location</h2>
            <p className="mb-5 text-sm text-gray-600">
              Search for an area or landmark, select a result, or click
              anywhere on the map to move the pin.
            </p>

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                className={`${inputClass} min-w-0 flex-1`}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void searchLocation();
                  }
                }}
                placeholder="Search area, landmark or address..."
              />

              <button
                type="button"
                onClick={() => void searchLocation()}
                disabled={searching}
                className="rounded-xl bg-emerald-800 px-6 py-3 font-bold text-white transition hover:bg-emerald-900 disabled:opacity-60"
              >
                {searching ? "Searching..." : "Search"}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="mt-3 overflow-hidden rounded-xl border border-gray-200">
                {searchResults.map((result) => (
                  <button
                    type="button"
                    key={result.place_id}
                    onClick={() => selectSearchResult(result)}
                    className="block w-full border-b border-gray-100 px-4 py-3 text-left text-sm last:border-b-0 hover:bg-emerald-50"
                  >
                    <span className="mr-2">📍</span>
                    {result.display_name}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4">
              <LocationPicker
                position={position}
                onChange={(point) => {
                  setPosition(point);
                  setMessage("");
                  void reverseGeocode(point);
                }}
              />
            </div>

            <p className="mt-3 text-xs text-gray-500">
              Map data © OpenStreetMap contributors. Search results depend
              on the availability of the address-search service.
            </p>

            {gettingAddress && (
              <p className="mt-2 text-sm text-gray-600">
                Getting address for selected pin...
              </p>
            )}

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>City *</label>
                <input
                  className={inputClass}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Enter city"
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Locality / Area *</label>
                <input
                  className={inputClass}
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="e.g. Kakadeo"
                  required
                />
              </div>
            </div>

            {locationAddress && (
              <div className="mt-4 rounded-xl bg-gray-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                  Selected map location
                </p>
                <p className="mt-1 break-words text-sm text-gray-700">
                  {locationAddress}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Coordinates: {position.lat.toFixed(6)},{" "}
                  {position.lng.toFixed(6)}
                </p>
              </div>
            )}
          </section>

          {message && (
            <div
              role="status"
              className={`rounded-xl p-4 text-sm ${
                messageType === "success"
                  ? "bg-emerald-50 text-emerald-900"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-800 px-6 py-4 font-bold text-white shadow-sm transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Publishing your item..." : "Publish item"}
          </button>

          <p className="text-center text-xs text-gray-500">
            Please choose a location that is safe to share. Avoid putting
            your private home address in the public listing.
          </p>
        </form>
      </div>
    </main>
  );
}
