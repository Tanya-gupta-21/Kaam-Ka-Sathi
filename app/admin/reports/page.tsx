"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";
type Report = {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  target_type: string;
  target_id: string;
  target_label: string;
  target_excerpt: string | null;
  reason: string;
  details: string;
  status: ReportStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};
type PublicProfile = { id: string; full_name: string | null };
type Triage = { id: string; category: string; priority: "low" | "medium" | "high"; summary: string };
type Filter = "all" | ReportStatus;

const STATUS_LABEL: Record<ReportStatus, string> = {
  open: "Open",
  reviewing: "Reviewing",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

const REASON_LABEL: Record<string, string> = {
  spam: "Spam or repeated promotion",
  scam: "Possible scam or misleading offer",
  harassment: "Harassment or abusive behavior",
  inappropriate: "Inappropriate content",
  unsafe: "Safety concern",
  other: "Other",
};

export default function AdminReportsPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [profiles, setProfiles] = useState<Record<string, PublicProfile>>({});
  const [analyses, setAnalyses] = useState<Record<string, Triage>>({});
  const [filter, setFilter] = useState<Filter>("open");
  const [loading, setLoading] = useState(true);
  const [adminId, setAdminId] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      router.replace("/login");
      return;
    }
    setAdminId(auth.user.id);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", auth.user.id)
      .maybeSingle();
    if (profileError || profile?.role !== "admin") {
      router.replace("/dashboard");
      return;
    }

    const { data, error: reportsError } = await supabase
      .from("community_reports")
      .select("id, reporter_id, reported_user_id, target_type, target_id, target_label, target_excerpt, reason, details, status, reviewed_by, reviewed_at, created_at")
      .order("created_at", { ascending: false })
      .limit(150);
    if (reportsError) {
      console.error("Community report load error:", reportsError.message);
      setError("Reports could not be loaded. Apply the community safety migration and try again.");
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as Report[];
    setReports(rows);
    const ids = [...new Set(rows.flatMap((row) => [row.reporter_id, row.reported_user_id]))];
    if (ids.length) {
      const { data: profileRows, error: profilesError } = await supabase
        .from("profiles_public")
        .select("id, full_name")
        .in("id", ids);
      if (profilesError) console.error("Report member names load error:", profilesError.message);
      setProfiles(Object.fromEntries(((profileRows ?? []) as PublicProfile[]).map((row) => [row.id, row])));
    } else {
      setProfiles({});
    }
    setLoading(false);
  }, [router, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadReports(), 0);
    return () => window.clearTimeout(timer);
  }, [loadReports]);

  const visibleReports = reports.filter((report) => filter === "all" || report.status === filter);
  const openCount = reports.filter((report) => report.status === "open" || report.status === "reviewing").length;

  async function analyzeReport(report: Report) {
    setBusyId(report.id);
    setError("");
    try {
      const response = await fetch("/api/admin/reports/triage", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reportIds: [report.id] }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "AI could not analyze this report.");
        return;
      }
      const analysis = (result.recommendations as Triage[] | undefined)?.[0];
      if (!analysis) {
        setError("AI returned no usable triage suggestion. Review the report manually.");
        return;
      }
      setAnalyses((current) => ({ ...current, [report.id]: analysis }));
    } catch {
      setError("AI triage could not be reached. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function updateStatus(report: Report, status: ReportStatus) {
    setBusyId(report.id);
    setError("");
    const { error: updateError } = await supabase
      .from("community_reports")
      .update({
        status,
        reviewed_by: status === "open" ? null : adminId,
        reviewed_at: status === "open" ? null : new Date().toISOString(),
      })
      .eq("id", report.id);
    if (updateError) {
      console.error("Report status update error:", updateError.message);
      setError("The report status could not be saved. Please try again.");
    } else {
      setReports((current) => current.map((row) => row.id === report.id ? {
        ...row,
        status,
        reviewed_by: status === "open" ? null : adminId,
        reviewed_at: status === "open" ? null : new Date().toISOString(),
      } : row));
    }
    setBusyId(null);
  }

  return (
    <main className="min-h-screen bg-[#f7f8f4] text-[#173d29]">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 bg-[#173d29] text-white lg:flex lg:flex-col">
          <div className="border-b border-white/10 px-7 py-7">
            <p className="text-lg font-black">♻️ Kaam Ka Sathi</p>
            <p className="mt-1 text-xs text-green-200">Admin Panel</p>
          </div>
          <nav className="flex-1 space-y-2 px-4 py-6">
            {[
              ["📊", "Dashboard", "/admin/dashboard"],
              ["👥", "Users", "/admin/users"],
              ["📦", "Items", "/admin/items"],
              ["🙋", "Community Needs", "/admin/needs"],
              ["❤️", "Interests", "/admin/interests"],
              ["🛡️", "Safety Reports", "/admin/reports"],
            ].map(([icon, label, href]) => (
              <button key={href} onClick={() => router.push(href)} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left font-semibold transition hover:bg-white/10 ${href === "/admin/reports" ? "bg-white/10 text-white" : "text-green-100"}`}>
                <span>{icon}</span>{label}
              </button>
            ))}
            <button onClick={() => router.push("/safety")} className="mt-5 flex w-full items-center gap-3 rounded-2xl border border-white/10 px-4 py-3.5 text-left font-semibold text-green-100 transition hover:bg-white/10"><span>👤</span>User Dashboard</button>
          </nav>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="border-b border-black/5 bg-[#f7f8f4] px-5 py-6 md:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black tracking-[0.18em] text-[#c63868]">COMMUNITY SAFETY</p>
                <h1 className="mt-1 text-3xl font-black md:text-4xl">Safety reports</h1>
                <p className="mt-2 text-sm text-gray-500">Review member reports. AI can summarize concerns and suggest priority; you make the decision.</p>
              </div>
              <button onClick={() => void loadReports()} disabled={loading} className="w-fit rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold transition hover:bg-gray-50 disabled:opacity-50">↻ Refresh</button>
            </div>
          </header>

          <div className="p-5 md:p-8">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-gray-500">Waiting for review</p><p className="mt-1 text-3xl font-black text-[#c63868]">{openCount}</p></div>
              <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-gray-500">All reports loaded</p><p className="mt-1 text-3xl font-black">{reports.length}</p></div>
              <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-gray-500">AI triage</p><p className="mt-1 text-sm font-bold">Admin-triggered suggestions</p></div>
            </div>

            {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}

            <div className="mt-8 flex flex-wrap gap-2">
              {(["open", "reviewing", "all", "resolved", "dismissed"] as Filter[]).map((value) => (
                <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-full px-4 py-2 text-sm font-bold transition ${filter === value ? "bg-[#173d29] text-white" : "bg-white text-gray-600 hover:bg-[#edf3ed]"}`}>
                  {value === "all" ? "All reports" : STATUS_LABEL[value]}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="mt-5 animate-pulse rounded-2xl bg-white p-12 text-center text-gray-500">Loading reports…</div>
            ) : visibleReports.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
                <span className="text-4xl">✅</span>
                <h2 className="mt-3 text-xl font-black">No {filter === "all" ? "reports" : STATUS_LABEL[filter].toLowerCase() + " reports"}</h2>
                <p className="mt-2 text-sm text-gray-600">New community reports will appear here.</p>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {visibleReports.map((report) => {
                  const analysis = analyses[report.id];
                  const reporter = profiles[report.reporter_id]?.full_name || "Community member";
                  const reported = profiles[report.reported_user_id]?.full_name || "Community member";
                  return (
                    <article key={report.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#fceaf0] px-3 py-1 text-xs font-black capitalize text-[#a92e57]">{REASON_LABEL[report.reason] || report.reason}</span>
                            <span className="rounded-full bg-[#edf3ed] px-3 py-1 text-xs font-bold capitalize">{report.target_type}</span>
                            <span className={`rounded-full px-3 py-1 text-xs font-black ${report.status === "open" ? "bg-amber-50 text-amber-800" : report.status === "reviewing" ? "bg-blue-50 text-blue-800" : "bg-gray-100 text-gray-600"}`}>{STATUS_LABEL[report.status]}</span>
                          </div>
                          <h2 className="mt-3 break-words text-lg font-black">{report.target_label}</h2>
                          <p className="mt-1 text-sm text-gray-500">Reported by <strong className="text-gray-700">{reporter}</strong> · about <strong className="text-gray-700">{reported}</strong> · {new Date(report.created_at).toLocaleString("en-IN")}</p>
                          {report.details && <p className="mt-4 whitespace-pre-wrap rounded-xl bg-[#f7f8f4] p-4 text-sm leading-6 text-gray-700">{report.details}</p>}
                          {report.target_excerpt && <blockquote className="mt-3 border-l-4 border-[#c63868] bg-pink-50/60 px-4 py-3 text-sm text-gray-700">Reported message: “{report.target_excerpt}”</blockquote>}

                          {analysis && (
                            <div className="mt-4 rounded-2xl border border-[#d5e8d5] bg-[#f4faf3] p-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-black">✨ AI triage suggestion</span>
                                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold capitalize">{analysis.category}</span>
                                <span className={`rounded-full px-2.5 py-1 text-xs font-black uppercase ${analysis.priority === "high" ? "bg-red-100 text-red-800" : analysis.priority === "medium" ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}`}>{analysis.priority} priority</span>
                              </div>
                              <p className="mt-2 text-sm leading-6 text-gray-700">{analysis.summary || "No additional summary."}</p>
                              <p className="mt-2 text-xs text-gray-500">AI cannot determine whether a report is true. Review the content and context before deciding.</p>
                            </div>
                          )}
                        </div>

                        <div className="flex shrink-0 flex-col gap-2 sm:flex-row xl:w-52 xl:flex-col">
                          <button type="button" onClick={() => void analyzeReport(report)} disabled={busyId === report.id || report.status === "resolved" || report.status === "dismissed"} className="rounded-xl bg-[#173d29] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#24573b] disabled:opacity-50">
                            {busyId === report.id ? "Working…" : analysis ? "Analyze again" : "✨ Analyze with AI"}
                          </button>
                          <select value={report.status} onChange={(event) => void updateStatus(report, event.target.value as ReportStatus)} disabled={busyId === report.id} aria-label={`Update status for ${report.target_label}`} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-bold text-gray-700 disabled:opacity-50">
                            {(Object.keys(STATUS_LABEL) as ReportStatus[]).map((status) => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}
                          </select>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
            <p className="mt-6 text-xs leading-5 text-gray-500">AI analysis sends only the report type, reason, and optional details to Gemini when you click Analyze. It does not see the member names or reported chat excerpt and never takes action automatically.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
