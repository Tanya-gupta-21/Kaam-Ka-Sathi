"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type LinkKey = "items" | "needs" | "services" | "matches" | "chat" | "profile" | "share" | "post_need";
type Message = { role: "user" | "assistant"; text: string; links?: LinkKey[] };
const DESTINATIONS: Record<LinkKey, { label: string; href: string }> = {
  items: { label: "Browse items", href: "/items" },
  needs: { label: "Community needs", href: "/needs" },
  services: { label: "Local services", href: "/services" },
  matches: { label: "Smart matches", href: "/matches" },
  chat: { label: "Messages", href: "/chat" },
  profile: { label: "My profile", href: "/profile" },
  share: { label: "Share an item", href: "/items/new" },
  post_need: { label: "Post a need", href: "/needs/new" },
};

export default function CommunityChatbot() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Hi! I’m Saathi, your AI helper. Ask me how to share, find something, or use the community." },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, busy, open]);

  async function send(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    setDraft("");
    setError("");
    setMessages((current) => [...current, { role: "user", text }]);
    setBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Please sign in to chat with Saathi.");
      const response = await fetch("/api/ai/chatbot", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ message: text, history: messages.slice(-8).map(({ role, text: content }) => ({ role, content })) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Saathi couldn’t reply. Please try again.");
      const links = Array.isArray(result.links) ? result.links.filter((key: unknown): key is LinkKey => typeof key === "string" && key in DESTINATIONS) : [];
      setMessages((current) => [...current, { role: "assistant", text: result.reply, links }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saathi couldn’t reply. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[70] font-sans">
      {open && <section aria-label="Saathi AI chat" className="mb-3 flex h-[min(600px,calc(100dvh-110px))] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-3xl border border-emerald-950/10 bg-white shadow-2xl shadow-emerald-950/20 animate-in fade-in slide-in-from-bottom-3">
        <header className="flex items-center justify-between bg-[#173d29] px-5 py-4 text-white">
          <div><p className="font-extrabold">🌱 Saathi AI</p><p className="text-xs text-emerald-100">Your community guide</p></div>
          <button onClick={() => setOpen(false)} aria-label="Close chat" className="rounded-full px-3 py-1 text-xl hover:bg-white/15">×</button>
        </header>
        <div className="flex-1 space-y-3 overflow-y-auto bg-[#f7f8f4] p-4" aria-live="polite">
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-[11px] leading-5 text-emerald-950">AI can make mistakes. Don’t share passwords, phone numbers, addresses, or other sensitive details.</p>
          {messages.map((message, index) => <div key={index} className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${message.role === "user" ? "ml-auto rounded-br-md bg-[#173d29] text-white" : "rounded-bl-md border border-gray-100 bg-white text-gray-800 shadow-sm"}`}>
            <p className="whitespace-pre-wrap">{message.text}</p>
            {message.links && message.links.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{message.links.map((key) => <button key={key} onClick={() => { router.push(DESTINATIONS[key].href); setOpen(false); }} className="rounded-full border border-emerald-200 px-2.5 py-1 text-xs font-bold text-emerald-900 hover:bg-emerald-50">{DESTINATIONS[key].label} →</button>)}</div>}
          </div>)}
          {busy && <div className="w-fit rounded-2xl bg-white px-4 py-3 text-sm text-gray-500 shadow-sm" aria-label="Saathi is thinking">Saathi is thinking…</div>}
          <div ref={endRef} />
        </div>
        {error && <p role="alert" className="px-4 pt-2 text-xs text-rose-700">{error}</p>}
        <form onSubmit={send} className="flex gap-2 border-t border-gray-100 bg-white p-3">
          <input value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={1200} placeholder="Ask Saathi anything…" aria-label="Message Saathi" className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-700" />
          <button disabled={busy || !draft.trim()} className="rounded-xl bg-[#173d29] px-4 font-bold text-white disabled:opacity-40" aria-label="Send message">➤</button>
        </form>
        <p className="px-3 pb-2 text-center text-[10px] text-gray-400">AI replies are generated by Gemini. Limit: 20 AI requests per hour.</p>
      </section>}
      <button onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? "Close Saathi AI chat" : "Open Saathi AI chat"} className="ml-auto flex h-14 items-center gap-2 rounded-full bg-[#173d29] px-5 font-extrabold text-white shadow-xl shadow-emerald-950/25 transition hover:-translate-y-1 hover:bg-[#215238]">
        <span className="text-xl">{open ? "×" : "✦"}</span><span>{open ? "Close" : "Ask Saathi"}</span>
      </button>
    </div>
  );
}
