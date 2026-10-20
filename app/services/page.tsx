"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";
import { SERVICE_CATEGORIES, serviceIcon } from "@/lib/serviceCategories";

type Service = {
  id: string;
  provider_id: string;
  category: string;
  title: string;
  description: string;
  city: string;
  locality: string | null;
  price: number | null;
  price_unit: string | null;
  created_at: string;
};

type PublicProfile = { id: string; full_name: string | null };

export default function ServicesPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [profiles, setProfiles] = useState<Record<string, PublicProfile>>({});
  const [userId, setUserId] = useState("");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadServices = useCallback(async () => {
    setError("");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      router.replace("/login");
      return;
    }
    setUserId(auth.user.id);

    const { data, error: serviceError } = await supabase
      .from("services")
      .select("id, provider_id, category, title, description, city, locality, price, price_unit, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (serviceError) {
      console.error("Service load error:", serviceError.message);
      setError("Services could not be loaded. Check the Supabase schema setup and try again.");
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as Service[];
    setServices(rows);
    const providerIds = [...new Set(rows.map((service) => service.provider_id))];
    if (providerIds.length) {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles_public")
        .select("id, full_name")
        .in("id", providerIds);
      if (profileError) console.error("Provider profile load error:", profileError.message);
      setProfiles(Object.fromEntries((profileData ?? []).map((profile) => [profile.id, profile])));
    } else {
      setProfiles({});
    }
    setLoading(false);
  }, [router, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadServices(), 0);
    return () => window.clearTimeout(timer);
  }, [loadServices]);

  const filteredServices = services.filter((service) => {
    const matchesCategory = category === "All" || service.category === category;
    const text = `${service.title} ${service.description} ${service.city} ${service.locality ?? ""}`.toLowerCase();
    return matchesCategory && text.includes(search.trim().toLowerCase());
  });

  async function contactProvider(service: Service) {
    if (!userId) {
      router.push("/login");
      return;
    }
    if (service.provider_id === userId) return;

    setBusyId(service.id);
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("service_id", service.id)
      .eq("interested_user_id", userId)
      .maybeSingle();

    let conversationId = existing?.id;
    if (!conversationId) {
      const { data: created, error: createError } = await supabase
        .from("conversations")
        .insert({
          service_id: service.id,
          owner_id: service.provider_id,
          interested_user_id: userId,
        })
        .select("id")
        .single();
      if (createError) {
        // Another click or tab may have created it at the same time.
        const { data: raced } = await supabase
          .from("conversations")
          .select("id")
          .eq("service_id", service.id)
          .eq("interested_user_id", userId)
          .maybeSingle();
        conversationId = raced?.id;
        if (!conversationId) setError("Could not start a chat. Please try again.");
      } else {
        conversationId = created.id;
      }
    }

    setBusyId(null);
    if (conversationId) router.push(`/chat/${conversationId}`);
  }

  return (
    <main className="min-h-screen bg-[#f7f8f4] text-[#173d29]">
      <Navbar />
      <section className="mx-auto max-w-6xl px-5 py-10 md:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#c63868]">Community help</p>
            <h1 className="mt-2 text-3xl font-black md:text-4xl">Local services</h1>
            <p className="mt-3 max-w-2xl leading-7 text-gray-600">Browse services offered by members near you and message a provider directly.</p>
          </div>
          <button onClick={() => router.push("/services/new")} className="rounded-xl bg-[#173d29] px-5 py-3 text-sm font-bold text-white hover:bg-[#24573b]">Offer a service</button>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_15rem]">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search service or area" className="rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-[#173d29]" />
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-[#173d29]">
            <option>All</option>
            {SERVICE_CATEGORIES.map((item) => <option key={item.name}>{item.name}</option>)}
          </select>
        </div>

        {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}

        {loading ? (
          <p className="mt-8 rounded-2xl bg-white p-10 text-center text-gray-500">Loading services…</p>
        ) : filteredServices.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-10 text-center">
            <p className="text-3xl">🛠️</p>
            <h2 className="mt-3 text-xl font-black">No services found</h2>
            <p className="mt-2 text-sm text-gray-600">Try another search, or add your service to the community directory.</p>
            <button onClick={() => router.push("/services/new")} className="mt-5 rounded-xl bg-[#c63868] px-5 py-3 text-sm font-bold text-white">Add a service</button>
          </div>
        ) : (
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {filteredServices.map((service) => (
              <article key={service.id} className="motion-enter rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#c63868]">{serviceIcon(service.category)} {service.category}</p>
                    <h2 className="mt-2 text-xl font-black">{service.title}</h2>
                  </div>
                  {service.price !== null && <p className="shrink-0 rounded-full bg-[#edf3ed] px-3 py-1.5 text-sm font-black">₹{service.price}{service.price_unit ? ` / ${service.price_unit}` : ""}</p>}
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-600">{service.description || "Contact the provider for details."}</p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 text-sm">
                  <div><p className="font-bold">{profiles[service.provider_id]?.full_name || "Community member"}</p><p className="mt-1 text-gray-500">📍 {service.locality ? `${service.locality}, ` : ""}{service.city}</p></div>
                  <button onClick={() => void contactProvider(service)} disabled={busyId === service.id || service.provider_id === userId} className="rounded-xl bg-[#173d29] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busyId === service.id ? "Opening chat…" : service.provider_id === userId ? "Your service" : "Message provider"}</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
