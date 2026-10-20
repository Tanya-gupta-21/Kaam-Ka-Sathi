"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";
import { SERVICE_CATEGORIES } from "@/lib/serviceCategories";
import AiDraftAssistant from "@/components/AiDraftAssistant";

export default function NewServicePage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [checkingUser, setCheckingUser] = useState(true);
  const [saving, setSaving] = useState(false);
  const [category, setCategory] = useState(SERVICE_CATEGORIES[0].name);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [locality, setLocality] = useState("");
  const [price, setPrice] = useState("");
  const [priceUnit, setPriceUnit] = useState("job");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      if (!data.user) router.replace("/login");
      else setUserId(data.user.id);
      setCheckingUser(false);
    });
    return () => { active = false; };
  }, [router, supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const cleanTitle = title.trim();
    const cleanCity = city.trim();
    if (!userId || !cleanTitle || !cleanCity) {
      setError("Add a service name and city before publishing.");
      return;
    }
    if (price && (!Number.isFinite(Number(price)) || Number(price) < 0)) {
      setError("Enter a valid non-negative price, or leave it blank.");
      return;
    }

    setSaving(true);
    const { error: insertError } = await supabase.from("services").insert({
      provider_id: userId,
      category,
      title: cleanTitle,
      description: description.trim(),
      city: cleanCity,
      locality: locality.trim() || null,
      price: price ? Number(price) : null,
      price_unit: price ? priceUnit : null,
      is_active: true,
    });
    setSaving(false);
    if (insertError) {
      console.error("Service publish error:", insertError.message);
      setError("Could not publish your service. Check the Supabase migration and try again.");
      return;
    }
    router.replace("/services");
    router.refresh();
  }

  const inputClass = "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-800 outline-none focus:border-[#173d29] focus:ring-2 focus:ring-[#173d29]/10";

  return (
    <main className="min-h-screen bg-[#f7f8f4] text-[#173d29]">
      <Navbar />
      <section className="mx-auto max-w-2xl px-5 py-10 md:px-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#c63868]">Local services</p>
        <h1 className="mt-2 text-3xl font-black">Offer a service</h1>
        <p className="mt-3 leading-7 text-gray-600">Add your service to the community directory. People can find you by service and location, then start a private chat.</p>
        {checkingUser ? <p className="mt-8 text-gray-500">Checking your account…</p> : (
          <form onSubmit={(event) => void handleSubmit(event)} className="motion-enter mt-7 space-y-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
            <div>
              <label htmlFor="service-category" className="mb-2 block text-sm font-bold">Service type</label>
              <select id="service-category" value={category} onChange={(event) => setCategory(event.target.value)} className={inputClass}>
                {SERVICE_CATEGORIES.map((item) => <option key={item.name} value={item.name}>{item.icon} {item.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="service-title" className="mb-2 block text-sm font-bold">Name your service</label>
              <input id="service-title" required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Maths tuition for classes 6–10" className={inputClass} />
            </div>
            <div>
              <label htmlFor="service-description" className="mb-2 block text-sm font-bold">Details</label>
              <textarea id="service-description" maxLength={2000} rows={5} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe your experience, availability, and what you offer." className={inputClass} />
              <p className="mt-1 text-right text-xs text-gray-400">{description.length}/2000</p>
            </div>
            <AiDraftAssistant
              task="service_draft"
              notes={[
                title.trim() && "Service: " + title.trim(),
                description.trim() && "What I offer: " + description.trim(),
              ].filter(Boolean).join("\n")}
              category={category}
              onApply={(draft) => {
                setTitle(draft.title);
                setDescription(draft.description.slice(0, 2000));
                setCategory(draft.category);
              }}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="service-city" className="mb-2 block text-sm font-bold">City</label><input id="service-city" required maxLength={100} value={city} onChange={(event) => setCity(event.target.value)} className={inputClass} /></div>
              <div><label htmlFor="service-locality" className="mb-2 block text-sm font-bold">Area / locality</label><input id="service-locality" maxLength={100} value={locality} onChange={(event) => setLocality(event.target.value)} className={inputClass} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="service-price" className="mb-2 block text-sm font-bold">Starting price (optional)</label><input id="service-price" type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} className={inputClass} /></div>
              <div><label htmlFor="service-price-unit" className="mb-2 block text-sm font-bold">Price unit</label><select id="service-price-unit" value={priceUnit} onChange={(event) => setPriceUnit(event.target.value)} disabled={!price} className={inputClass}><option value="job">per job</option><option value="hour">per hour</option><option value="day">per day</option><option value="month">per month</option></select></div>
            </div>
            {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={saving || checkingUser || !userId} className="rounded-xl bg-[#173d29] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{saving ? "Publishing…" : "Publish service"}</button>
              <button type="button" onClick={() => router.push("/services")} className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold">Cancel</button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
