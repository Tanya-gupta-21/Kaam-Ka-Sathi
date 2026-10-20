"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";

type MyItem = { id: number; title: string };

type Candidate = { userId: string; name: string };

type Handover = {
  id: string;
  item_id: number;
  giver_id: string;
  receiver_id: string;
  status: "pending" | "confirmed" | "declined";
  created_at: string;
  confirmed_at: string | null;
  items?: { title: string } | null;
};

const GIVE_POINTS = 10;
const RECEIVE_POINTS = 2;

export default function HandoversPage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [myItems, setMyItems] = useState<MyItem[]>([]);
  const [candidates, setCandidates] = useState<Record<number, Candidate[]>>({});
  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});

  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("success");

  async function loadAll() {
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      router.replace("/login");
      return;
    }

    const uid = auth.user.id;
    setUserId(uid);

    // My items
    const { data: items } = await supabase
      .from("items")
      .select("id, title")
      .eq("owner_id", uid)
      .order("created_at", { ascending: false });

    const itemList = (items as MyItem[]) || [];
    setMyItems(itemList);

    // Handovers I am part of (the database only returns mine)
    const { data: hoData } = await supabase
      .from("item_handovers")
      .select(
        "id, item_id, giver_id, receiver_id, status, created_at, confirmed_at, items(title)"
      )
      .order("created_at", { ascending: false });

    const hoList = (hoData as unknown as Handover[]) || [];
    setHandovers(hoList);

    // People who showed interest in my items (interests + chats)
    const byItem: Record<number, Set<string>> = {};
    const itemIds = itemList.map((i) => i.id);

    if (itemIds.length > 0) {
      const { data: interests } = await supabase
        .from("interests")
        .select("item_id, interested_user_id")
        .in("item_id", itemIds);

      const { data: convos } = await supabase
        .from("conversations")
        .select("item_id, interested_user_id")
        .eq("owner_id", uid)
        .in("item_id", itemIds);

      [...(interests || []), ...(convos || [])].forEach((row) => {
        const itemId = Number(row.item_id);
        if (!byItem[itemId]) byItem[itemId] = new Set();
        if (row.interested_user_id && row.interested_user_id !== uid) {
          byItem[itemId].add(String(row.interested_user_id));
        }
      });
    }

    // Names for everyone involved
    const idSet = new Set<string>();
    Object.values(byItem).forEach((s) => s.forEach((id) => idSet.add(id)));
    hoList.forEach((h) => {
      idSet.add(h.giver_id);
      idSet.add(h.receiver_id);
    });

    const nameMap: Record<string, string> = {};
    if (idSet.size > 0) {
      const { data: profiles } = await supabase
        .from("profiles_public")
        .select("id, full_name")
        .in("id", Array.from(idSet));

      (profiles || []).forEach((p) => {
        nameMap[p.id] = p.full_name || "Community member";
      });
    }
    setNames(nameMap);

    const candMap: Record<number, Candidate[]> = {};
    Object.entries(byItem).forEach(([itemId, set]) => {
      candMap[Number(itemId)] = Array.from(set).map((id) => ({
        userId: id,
        name: nameMap[id] || "Community member",
      }));
    });
    setCandidates(candMap);

    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAll(), 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startHandover(item: MyItem, receiver: Candidate) {
    const ok = window.confirm(
      `Hand over "${item.title}" to ${receiver.name}?\n\n${receiver.name} will be asked to confirm that they received it.`
    );
    if (!ok) return;

    setBusy(`start-${item.id}-${receiver.userId}`);
    setMessage("");

    const { error } = await supabase.rpc("start_handover", {
      p_item_id: item.id,
      p_receiver_id: receiver.userId,
    });

    if (error) {
      setMessage(error.message);
      setMessageType("error");
    } else {
      setMessage(
        `Done! Waiting for ${receiver.name} to confirm. You earn points after they confirm. 🎉`
      );
      setMessageType("success");
      await loadAll();
    }

    setBusy(null);
  }

  async function respond(handover: Handover, accept: boolean) {
    setBusy(`respond-${handover.id}`);
    setMessage("");

    const { error } = await supabase.rpc("respond_handover", {
      p_handover_id: handover.id,
      p_accept: accept,
    });

    if (error) {
      setMessage(error.message);
      setMessageType("error");
    } else {
      setMessage(
        accept
          ? "Thank you for confirming! Points have been added. 💚"
          : "Marked as not received."
      );
      setMessageType("success");
      await loadAll();
    }

    setBusy(null);
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f4]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#dfe7df] border-t-[#173d29]" />
          <p className="mt-4 font-medium text-gray-500">Loading...</p>
        </div>
      </main>
    );
  }

  const incoming = handovers.filter(
    (h) => h.receiver_id === userId && h.status === "pending"
  );

  const busyItemIds = new Set(
    handovers
      .filter((h) => h.status === "pending" || h.status === "confirmed")
      .map((h) => h.item_id)
  );

  const giveList = myItems.filter((i) => !busyItemIds.has(i.id));

  return (
    <main className="min-h-screen bg-[#f7f8f4] text-[#173d29]">
      <Navbar />

      <div className="mx-auto max-w-5xl px-5 py-10 md:px-8">
        <p className="text-xs font-black tracking-[0.2em] text-[#c63868]">
          HANDOVERS
        </p>
        <h1 className="mt-1 text-3xl font-black md:text-4xl">
          Give, receive, earn points
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-500">
          When you hand over an item and the receiver confirms, you earn{" "}
          <b>+{GIVE_POINTS} points</b> and the receiver earns{" "}
          <b>+{RECEIVE_POINTS} points</b>. Points are added only after the
          receiver confirms.
        </p>

        {message && (
          <div
            role="status"
            className={`mt-6 rounded-2xl border p-4 text-sm font-semibold ${
              messageType === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        {/* INCOMING */}
        <section className="mt-10">
          <h2 className="text-xl font-black">📥 Waiting for your confirmation</h2>

          {incoming.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-white p-5 text-sm text-gray-500 shadow-sm">
              Nothing to confirm right now.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {incoming.map((h) => (
                <div
                  key={h.id}
                  className="flex flex-col gap-4 rounded-3xl border border-[#eadfe3] bg-[#fff5f8] p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-black">
                      {names[h.giver_id] || "Someone"} says they gave you
                      “{h.items?.title || "an item"}”
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Did you receive it? Confirm to earn +{RECEIVE_POINTS}{" "}
                      points.
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => respond(h, true)}
                      disabled={busy === `respond-${h.id}`}
                      className="rounded-xl bg-[#173d29] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#24573b] disabled:opacity-60"
                    >
                      ✅ Yes, received
                    </button>
                    <button
                      onClick={() => respond(h, false)}
                      disabled={busy === `respond-${h.id}`}
                      className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                    >
                      Not received
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* GIVE */}
        <section className="mt-10">
          <h2 className="text-xl font-black">🎁 Hand over one of my items</h2>

          {giveList.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-white p-5 text-sm text-gray-500 shadow-sm">
              You have no items waiting to be handed over.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {giveList.map((item) => {
                const people = candidates[item.id] || [];

                return (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-[#e8e5dd] bg-white p-5 shadow-sm"
                  >
                    <p className="font-black">{item.title}</p>

                    {people.length === 0 ? (
                      <p className="mt-2 text-sm text-gray-500">
                        No one has shown interest yet.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                          Interested people
                        </p>

                        {people.map((p) => (
                          <div
                            key={p.userId}
                            className="flex items-center justify-between gap-3 rounded-2xl bg-[#f7f8f4] px-4 py-3"
                          >
                            <span className="text-sm font-semibold">
                              👤 {p.name}
                            </span>

                            <button
                              onClick={() => startHandover(item, p)}
                              disabled={busy === `start-${item.id}-${p.userId}`}
                              className="rounded-xl bg-[#c63868] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#a92e57] disabled:opacity-60"
                            >
                              🤝 Hand over
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* HISTORY */}
        <section className="mt-10">
          <h2 className="text-xl font-black">🕒 My handovers</h2>

          {handovers.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-white p-5 text-sm text-gray-500 shadow-sm">
              No handovers yet.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-gray-100 overflow-hidden rounded-3xl bg-white shadow-sm">
              {handovers.map((h) => {
                const iGave = h.giver_id === userId;
                const other = iGave ? h.receiver_id : h.giver_id;

                return (
                  <div
                    key={h.id}
                    className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-bold">
                        {h.items?.title || "Item"}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {iGave ? "Given to" : "Received from"}{" "}
                        {names[other] || "Community member"} ·{" "}
                        {formatDate(h.confirmed_at || h.created_at)}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-black ${
                        h.status === "confirmed"
                          ? "bg-green-100 text-[#173d29]"
                          : h.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {h.status === "confirmed"
                        ? "Confirmed ✓"
                        : h.status === "pending"
                          ? "Waiting for confirmation"
                          : "Not received"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
