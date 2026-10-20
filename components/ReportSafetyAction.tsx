"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type ReportTargetType = "item" | "need" | "service" | "profile" | "conversation" | "message";

type Props = {
  targetType: ReportTargetType;
  targetId: string | number;
  reportedUserId?: string | null;
  compact?: boolean;
  onBlocked?: () => void;
};

const REASONS = [
  { value: "spam", label: "Spam or repeated promotion" },
  { value: "scam", label: "Possible scam or misleading offer" },
  { value: "harassment", label: "Harassment or abusive behavior" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "unsafe", label: "Safety concern" },
  { value: "other", label: "Something else" },
] as const;

export default function ReportSafetyAction({
  targetType,
  targetId,
  reportedUserId,
  compact = false,
  onBlocked,
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [reason, setReason] = useState<(typeof REASONS)[number]["value"]>("unsafe");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [message, setMessage] = useState("");

  async function openActions() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.push("/login");
      return;
    }
    setCurrentUserId(data.user.id);
    setMessage("");
    setOpen(true);
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || reportSent) return;
    setBusy(true);
    setMessage("");

    const { error } = await supabase.rpc("submit_community_report", {
      p_target_type: targetType,
      p_target_id: String(targetId),
      p_reason: reason,
      p_details: details.trim(),
    });

    if (error) {
      setMessage(
        error.code === "23505"
          ? "You already have an open report for this content."
          : error.message || "The report could not be submitted. Please try again."
      );
    } else {
      setReportSent(true);
      setMessage("Report sent. An admin will review it.");
    }
    setBusy(false);
  }

  async function blockMember() {
    if (!currentUserId || !reportedUserId || currentUserId === reportedUserId || busy) return;
    setBusy(true);
    setMessage("");
    const { error } = await supabase.from("member_blocks").insert({
      blocker_id: currentUserId,
      blocked_id: reportedUserId,
    });

    if (error && error.code !== "23505") {
      setMessage(error.message || "This member could not be blocked.");
    } else {
      setBlocked(true);
      setMessage("Member blocked. Their posts are hidden and new interactions are disabled.");
      onBlocked?.();
    }
    setBusy(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void openActions()}
        className={compact
          ? "rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 transition hover:border-[#c63868] hover:text-[#c63868]"
          : "mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-600 transition hover:border-[#c63868] hover:text-[#c63868]"}
      >
        🛡️ Report / block
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#102d1e]/55 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy) setOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-safety-title"
            className="motion-enter max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c63868]">Community safety</p>
                <h2 id="report-safety-title" className="mt-2 text-2xl font-black text-[#173d29]">Report or block</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">Reports go to the admin review queue. AI may help admins sort the reason and details; an admin makes every decision.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} disabled={busy} aria-label="Close" className="rounded-full p-2 text-xl text-gray-400 hover:bg-gray-100">×</button>
            </div>

            <form onSubmit={(event) => void submitReport(event)} className="mt-6 space-y-4">
              <label className="block text-sm font-bold text-[#173d29]">
                Why are you reporting this?
                <select
                  value={reason}
                  onChange={(event) => setReason(event.target.value as typeof reason)}
                  disabled={reportSent || busy}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-normal outline-none focus:border-[#173d29]"
                >
                  {REASONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="block text-sm font-bold text-[#173d29]">
                Details <span className="font-normal text-gray-400">(optional)</span>
                <textarea
                  value={details}
                  onChange={(event) => setDetails(event.target.value.slice(0, 1000))}
                  disabled={reportSent || busy}
                  rows={4}
                  maxLength={1000}
                  placeholder="Share only the details admins need to review the issue."
                  className="mt-2 w-full resize-y rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#173d29]"
                />
                <span className="mt-1 block text-right text-xs font-normal text-gray-400">{details.length}/1000</span>
              </label>
              <p className="text-xs leading-5 text-gray-500">If an admin runs AI triage, only the report type, selected reason, and these details are sent to Gemini. Names, account IDs, and chat excerpts are not sent. Avoid private or sensitive information.</p>

              {message && <p role="status" className={`rounded-xl p-3 text-sm ${reportSent || blocked ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>{message}</p>}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="submit" disabled={busy || reportSent} className="flex-1 rounded-xl bg-[#173d29] px-4 py-3 font-bold text-white transition hover:bg-[#24573b] disabled:opacity-50">
                  {busy ? "Sending…" : reportSent ? "Report sent" : "Submit report"}
                </button>
                {reportedUserId && reportedUserId !== currentUserId && (
                  <button type="button" onClick={() => void blockMember()} disabled={busy || blocked} className="flex-1 rounded-xl border border-red-200 px-4 py-3 font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50">
                    {blocked ? "Member blocked" : "Block this member"}
                  </button>
                )}
              </div>
              <button type="button" onClick={() => router.push("/safety")} className="w-full pt-1 text-sm font-bold text-[#356b45] hover:underline">
                Manage blocked members
              </button>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
