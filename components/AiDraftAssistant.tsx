"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type AiDraft = {
  title: string;
  description: string;
  category: string;
};

type Props = {
  task: "item_draft" | "need_draft" | "service_draft";
  notes: string;
  category: string;
  onApply: (draft: AiDraft) => void;
};

export default function AiDraftAssistant({ task, notes, category, onApply }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<AiDraft | null>(null);

  async function generateDraft() {
    setLoading(true);
    setError("");
    setDraft(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Please sign in to use the AI assistant.");
      const response = await fetch("/api/ai/assist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + session.access_token,
        },
        body: JSON.stringify({ task, notes, category }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not create an AI draft.");
      if (
        typeof result.title !== "string" ||
        typeof result.description !== "string" ||
        typeof result.category !== "string"
      ) {
        throw new Error("The AI returned an incomplete draft. Please try again.");
      }
      setDraft(result as AiDraft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create an AI draft.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className="rounded-2xl border border-violet-100 bg-violet-50/70 p-4 transition-shadow duration-300 hover:shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-violet-950">✨ AI writing assistant</p>
          <p className="mt-1 text-xs leading-5 text-violet-900/75">
            Turn your notes into a clearer draft. Notes are sent to Gemini; avoid private information. AI suggestions may be wrong, so review before publishing.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void generateDraft()}
          disabled={loading || notes.trim().length < 8}
          className="shrink-0 rounded-xl bg-violet-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {loading ? "Writing…" : draft ? "Try again" : "Draft with AI"}
        </button>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      {draft && (
        <div className="motion-enter mt-4 rounded-xl bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-violet-800">Suggested draft · {draft.category}</p>
          <h3 className="mt-2 font-bold text-gray-900">{draft.title}</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">{draft.description}</p>
          <button
            type="button"
            onClick={() => onApply(draft)}
            className="mt-3 rounded-lg bg-violet-100 px-3 py-2 text-sm font-bold text-violet-950"
          >
            Use this draft
          </button>
        </div>
      )}
    </aside>
  );
}
