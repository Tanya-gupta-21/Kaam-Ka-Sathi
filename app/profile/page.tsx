"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import MemberCard from "@/components/MemberCard";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [locality, setLocality] = useState("");
  const [bio, setBio] = useState("");

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [newAvatar, setNewAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  const [cardKey, setCardKey] = useState(0);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();

      if (!auth.user) {
        router.replace("/login");
        return;
      }

      setUserId(auth.user.id);

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("full_name, email, phone, city, locality, avatar_url, bio")
        .eq("id", auth.user.id)
        .maybeSingle();

      if (error) {
        console.error("Profile load error:", error);
        setMessage("Could not load your profile. Please refresh.");
        setMessageType("error");
      }

      setFullName(profile?.full_name ?? "");
      setEmail(profile?.email ?? auth.user.email ?? "");
      setPhone(profile?.phone ?? "");
      setCity(profile?.city ?? "");
      setLocality(profile?.locality ?? "");
      setBio(profile?.bio ?? "");
      setAvatarUrl(profile?.avatar_url ?? null);
      setLoading(false);
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Free the preview URL when it changes
  useEffect(() => {
    return () => {
      if (avatarPreview.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setMessage("Please choose a JPG, PNG or WebP image.");
      setMessageType("error");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setMessage("Photo must be 2 MB or smaller.");
      setMessageType("error");
      e.target.value = "";
      return;
    }

    setNewAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
    setMessage("");
  }

  function removePhoto() {
    setNewAvatar(null);
    setAvatarPreview("");
    setAvatarUrl(null);
  }

  // Get the storage path from a public URL, so the old photo can be removed
  function pathFromPublicUrl(url: string | null) {
    if (!url) return null;
    const marker = "/avatars/";
    const index = url.indexOf(marker);
    return index === -1 ? null : url.slice(index + marker.length);
  }

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    const cleanName = fullName.trim();

    if (!cleanName) {
      setMessage("Please enter your name.");
      setMessageType("error");
      return;
    }

    setSaving(true);

    try {
      const { data: current } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", userId)
        .maybeSingle();

      const oldPath = pathFromPublicUrl(current?.avatar_url ?? null);
      let finalAvatarUrl = avatarUrl;

      // Upload the new photo (unique file name, so no overwrite is needed)
      if (newAvatar) {
        const ext =
          newAvatar.type === "image/png"
            ? "png"
            : newAvatar.type === "image/webp"
              ? "webp"
              : "jpg";

        const path = `${userId}/avatar-${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, newAvatar, {
            upsert: false,
            contentType: newAvatar.type,
          });

        if (uploadError) {
          throw new Error(`Photo upload failed: ${uploadError.message}`);
        }

        finalAvatarUrl = supabase.storage.from("avatars").getPublicUrl(path)
          .data.publicUrl;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: cleanName,
          city: city.trim() || null,
          locality: locality.trim() || null,
          bio: bio.trim() || null,
          avatar_url: finalAvatarUrl,
        })
        .eq("id", userId);

      if (updateError) throw new Error(updateError.message);

      // Remove the previous photo if it was replaced or removed (best effort)
      if (oldPath && current?.avatar_url !== finalAvatarUrl) {
        await supabase.storage.from("avatars").remove([oldPath]);
      }

      setAvatarUrl(finalAvatarUrl);
      setNewAvatar(null);
      setAvatarPreview("");
      setCardKey((k) => k + 1);
      setMessage("Profile saved successfully! ✅");
      setMessageType("success");
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";
  const labelClass = "mb-2 block text-sm font-semibold text-gray-700";

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f4]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#dfe7df] border-t-[#173d29]" />
          <p className="mt-4 font-medium text-gray-500">Loading profile...</p>
        </div>
      </main>
    );
  }

  const shownAvatar = avatarPreview || avatarUrl;

  return (
    <main className="min-h-screen bg-[#f7f8f4] text-[#173d29]">
      <Navbar />

      <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">
        <p className="text-xs font-black tracking-[0.2em] text-[#c63868]">
          MY PROFILE
        </p>
        <h1 className="mt-1 text-3xl font-black md:text-4xl">
          Your profile
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Keep your details up to date so the community can trust and
          recognise you.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
          {/* Member card (refreshes after save) */}
          <div>
            <MemberCard key={cardKey} />
          </div>

          {/* Edit form */}
          <form
            onSubmit={handleSave}
            className="space-y-6 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8"
          >
            {/* Photo */}
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
              {shownAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={shownAvatar}
                  alt="Profile photo"
                  className="h-24 w-24 rounded-full border-4 border-[#e7efe8] object-cover"
                />
              ) : (
                <span className="flex h-24 w-24 items-center justify-center rounded-full bg-[#c63868] text-4xl font-black text-white">
                  {(fullName || "?").charAt(0).toUpperCase()}
                </span>
              )}

              <div className="text-center sm:text-left">
                <label className="inline-block cursor-pointer rounded-xl bg-[#173d29] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#24573b]">
                  {shownAvatar ? "Change photo" : "Upload photo"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>

                {shownAvatar && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="ml-3 text-sm font-semibold text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                )}

                <p className="mt-2 text-xs text-gray-500">
                  JPG, PNG or WebP, up to 2 MB. Click Save to apply.
                </p>
              </div>
            </div>

            <hr className="border-gray-100" />

            <div>
              <label className={labelClass}>Full name *</label>
              <input
                className={inputClass}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                maxLength={80}
                required
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>City</label>
                <input
                  className={inputClass}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Kanpur"
                />
              </div>

              <div>
                <label className={labelClass}>Area / Locality</label>
                <input
                  className={inputClass}
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="e.g. Kakadeo"
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>About me</label>
              <textarea
                className={inputClass}
                rows={4}
                maxLength={200}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A line or two about you and how you like to help..."
              />
              <p className="mt-1 text-right text-xs text-gray-400">
                {bio.length}/200
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Email</label>
                <input
                  className={`${inputClass} cursor-not-allowed bg-gray-50 text-gray-500`}
                  value={email}
                  readOnly
                  disabled
                />
              </div>

              <div>
                <label className={labelClass}>Mobile</label>
                <input
                  className={`${inputClass} cursor-not-allowed bg-gray-50 text-gray-500`}
                  value={phone || "Not added"}
                  readOnly
                  disabled
                />
              </div>
            </div>

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
              disabled={saving}
              className="w-full rounded-xl bg-emerald-800 px-6 py-4 font-bold text-white shadow-sm transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save profile"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
