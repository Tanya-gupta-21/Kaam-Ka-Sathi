"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";

type BlockedMember = {
  blocked_id: string;
  full_name: string | null;
  city: string | null;
  avatar_url: string | null;
  blocked_at: string;
};

export default function SafetyPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [members, setMembers] = useState<BlockedMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const loadBlockedMembers = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase.rpc("get_my_blocked_members");
    if (error) {
      console.error("Blocked members load error:", error.message);
      setMessage("Blocked members could not be loaded. Apply the community safety migration and try again.");
    } else {
      setMembers((data ?? []) as BlockedMember[]);
    }
    setLoading(false);
  }, [router, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadBlockedMembers(), 0);
    return () => window.clearTimeout(timer);
  }, [loadBlockedMembers]);

  async function unblockMember(member: BlockedMember) {
    setBusyId(member.blocked_id);
    setMessage("");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      router.replace("/login");
      return;
    }

    const { error } = await supabase
      .from("member_blocks")
      .delete()
      .eq("blocker_id", auth.user.id)
      .eq("blocked_id", member.blocked_id);
    if (error) {
      setMessage("This member could not be unblocked. Please try again.");
    } else {
      setMembers((current) => current.filter((item) => item.blocked_id !== member.blocked_id));
    }
    setBusyId(null);
  }

  return (
    <main className="min-h-screen bg-[#f7f8f4] text-[#173d29]">
      <Navbar />
      <section className="mx-auto max-w-5xl px-5 py-10 md:px-8">
        <div className="motion-enter rounded-3xl bg-[#173d29] p-7 text-white shadow-xl md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-green-200">Your controls</p>
          <h1 className="mt-2 text-3xl font-black md:text-4xl">Safety & privacy</h1>
          <p className="mt-3 max-w-2xl leading-7 text-green-100">Blocked members are hidden from your community listings. New chats, interests, help offers, and handovers between you are disabled. You can unblock someone at any time.</p>
          <button onClick={() => router.push("/items")} className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#173d29] transition hover:bg-green-50">Browse community</button>
        </div>

        <div className="mt-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c63868]">Account settings</p>
            <h2 className="mt-1 text-2xl font-black">Blocked members</h2>
          </div>
          <span className="rounded-full bg-white px-3 py-1.5 text-sm font-bold shadow-sm">{members.length}</span>
        </div>

        {message && <p role="alert" className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{message}</p>}
        {loading ? (
          <div className="mt-5 animate-pulse rounded-2xl bg-white p-10 text-center text-gray-500">Loading your settings…</div>
        ) : members.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
            <span className="text-4xl">🛡️</span>
            <h3 className="mt-3 text-xl font-black">No blocked members</h3>
            <p className="mt-2 text-sm text-gray-600">If you block someone from a post or service, you can manage it here.</p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {members.map((member) => (
              <article key={member.blocked_id} className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  {member.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={member.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#edf3ed] text-xl">👤</span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-black">{member.full_name || "Community member"}</p>
                    <p className="mt-1 text-sm text-gray-500">{member.city || "Community member"} · blocked {new Date(member.blocked_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                </div>
                <button type="button" onClick={() => void unblockMember(member)} disabled={busyId === member.blocked_id} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-[#173d29] transition hover:border-[#173d29] disabled:opacity-50">
                  {busyId === member.blocked_id ? "Unblocking…" : "Unblock"}
                </button>
              </article>
            ))}
          </div>
        )}

        <p className="mt-8 rounded-2xl border border-[#f4d9e2] bg-white p-5 text-sm leading-6 text-gray-600"><strong className="text-[#173d29]">Need help?</strong> Report inappropriate listings or conduct from the item, need, or service card. Reports are reviewed by an admin; AI may suggest a category and priority, but it never decides whether a person or post is at fault.</p>
      </section>
    </main>
  );
}
