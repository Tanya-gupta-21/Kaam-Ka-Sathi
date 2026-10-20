"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";
import { SERVICE_CATEGORIES } from "@/lib/serviceCategories";

type Service = {
  id: string;
  category: string;
  title: string;
  description: string;
  city: string;
  locality: string | null;
  price: number | null;
  price_unit: string | null;
  is_active: boolean;
};

export default function MyServicesPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [editing, setEditing] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadServices = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      router.replace("/login");
      return;
    }
    setUserId(auth.user.id);
    const { data, error: loadError } = await supabase
      .from("services")
      .select("id, category, title, description, city, locality, price, price_unit, is_active")
      .eq("provider_id", auth.user.id)
      .order("created_at", { ascending: false });
    if (loadError) {
      console.error("My services load error:", loadError.message);
      setError("Could not load your services. Check the Supabase migration and try again.");
    } else {
      setServices((data ?? []) as Service[]);
      setError("");
    }
    setLoading(false);
  }, [router, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadServices(), 0);
    return () => window.clearTimeout(timer);
  }, [loadServices]);

  async function saveService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || !userId) return;
    setBusyId(editing.id);
    const { error: saveError } = await supabase.from("services").update({
      category: editing.category,
      title: editing.title.trim(),
      description: editing.description.trim(),
      city: editing.city.trim(),
      locality: editing.locality?.trim() || null,
      price: editing.price === null ? null : Number(editing.price),
      price_unit: editing.price === null ? null : editing.price_unit,
    }).eq("id", editing.id).eq("provider_id", userId);
    setBusyId(null);
    if (saveError) {
      setError("Could not save the changes. Please check the values and try again.");
      return;
    }
    setEditing(null);
    await loadServices();
  }

  async function toggleActive(service: Service) {
    setBusyId(service.id);
    const { error: updateError } = await supabase.from("services")
      .update({ is_active: !service.is_active })
      .eq("id", service.id).eq("provider_id", userId);
    setBusyId(null);
    if (updateError) setError("Could not update this service. Please try again.");
    else await loadServices();
  }

  async function deleteService(service: Service) {
    if (!window.confirm(`Delete “${service.title}” from your services?`)) return;
    setBusyId(service.id);
    const { error: deleteError } = await supabase.from("services")
      .delete().eq("id", service.id).eq("provider_id", userId);
    setBusyId(null);
    if (deleteError) setError("Could not delete this service. Please try again.");
    else {
      if (editing?.id === service.id) setEditing(null);
      await loadServices();
    }
  }

  const inputClass = "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-[#173d29]";

  return (
    <main className="min-h-screen bg-[#f7f8f4] text-[#173d29]">
      <Navbar />
      <section className="mx-auto max-w-4xl px-5 py-10 md:px-8">
        <div className="flex items-end justify-between gap-4">
          <div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#c63868]">Provider tools</p><h1 className="mt-2 text-3xl font-black">My services</h1></div>
          <button onClick={() => router.push("/services/new")} className="rounded-xl bg-[#173d29] px-4 py-3 text-sm font-bold text-white">Add service</button>
        </div>
        {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {loading ? <p className="mt-7 rounded-2xl bg-white p-8 text-gray-500">Loading your services…</p> : services.length === 0 ? (
          <div className="mt-7 rounded-2xl bg-white p-8 text-center"><p className="font-bold">You have not listed a service yet.</p><button onClick={() => router.push("/services/new")} className="mt-4 rounded-xl bg-[#c63868] px-4 py-2.5 text-sm font-bold text-white">Create your first listing</button></div>
        ) : <div className="mt-7 space-y-4">{services.map((service) => (
          <article key={service.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            {editing?.id === service.id ? (
              <form onSubmit={(event) => void saveService(event)} className="space-y-4">
                <select aria-label="Service category" value={editing.category} onChange={(event) => setEditing({ ...editing, category: event.target.value })} className={inputClass}>{SERVICE_CATEGORIES.map((item) => <option key={item.name}>{item.name}</option>)}</select>
                <input aria-label="Service title" required maxLength={120} value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} className={inputClass} />
                <textarea aria-label="Service description" maxLength={2000} rows={4} value={editing.description} onChange={(event) => setEditing({ ...editing, description: event.target.value })} className={inputClass} />
                <div className="grid gap-3 sm:grid-cols-2"><input aria-label="City" required maxLength={100} value={editing.city} onChange={(event) => setEditing({ ...editing, city: event.target.value })} className={inputClass} /><input aria-label="Locality" maxLength={100} value={editing.locality ?? ""} onChange={(event) => setEditing({ ...editing, locality: event.target.value })} className={inputClass} /></div>
                <div className="grid gap-3 sm:grid-cols-2"><input aria-label="Price" type="number" min="0" step="0.01" value={editing.price ?? ""} onChange={(event) => setEditing({ ...editing, price: event.target.value === "" ? null : Number(event.target.value) })} className={inputClass} /><select aria-label="Price unit" value={editing.price_unit ?? "job"} onChange={(event) => setEditing({ ...editing, price_unit: event.target.value })} className={inputClass}><option value="job">per job</option><option value="hour">per hour</option><option value="day">per day</option><option value="month">per month</option></select></div>
                <div className="flex gap-3"><button disabled={busyId === service.id} className="rounded-xl bg-[#173d29] px-4 py-2.5 text-sm font-bold text-white">{busyId === service.id ? "Saving…" : "Save changes"}</button><button type="button" onClick={() => setEditing(null)} className="rounded-xl border px-4 py-2.5 text-sm font-bold">Cancel</button></div>
              </form>
            ) : (
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-xs font-bold uppercase tracking-wide text-[#c63868]">{service.category} · {service.is_active ? "Published" : "Paused"}</p><h2 className="mt-1 text-xl font-black">{service.title}</h2><p className="mt-1 text-sm text-gray-500">{service.locality ? `${service.locality}, ` : ""}{service.city}{service.price !== null ? ` · ₹${service.price}${service.price_unit ? ` / ${service.price_unit}` : ""}` : ""}</p></div><div className="flex flex-wrap gap-2"><button onClick={() => setEditing(service)} className="rounded-lg border px-3 py-2 text-sm font-bold">Edit</button><button disabled={busyId === service.id} onClick={() => void toggleActive(service)} className="rounded-lg border px-3 py-2 text-sm font-bold disabled:opacity-50">{service.is_active ? "Pause" : "Publish"}</button><button disabled={busyId === service.id} onClick={() => void deleteService(service)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700 disabled:opacity-50">Delete</button></div></div>
            )}
          </article>
        ))}</div>}
      </section>
    </main>
  );
}
