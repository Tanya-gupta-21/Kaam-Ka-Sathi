
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Item = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  condition: string | null;
  city: string | null;
  locality: string | null;
  owner_id: string;
  created_at: string;
};

type Need = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  city: string | null;
  locality: string | null;
  user_id: string;
  created_at: string;
};

type SmartMatch = {
  id: string;
  item: Item;
  need: Need;
  score: number;
  matchedKeywords: string[];
  reasons: string[];
  otherUserId: string;
};

const MINIMUM_MATCH_SCORE = 25;

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "from", "that", "this",
  "want", "need", "needed", "looking", "required",
  "available", "good", "used", "new", "please",
  "have", "has", "are", "was", "is", "a", "an",
  "of", "to", "in", "on", "at", "my", "me", "i",
  "we", "you", "it", "or", "some", "any", "class",
]);

function normalize(value?: string | null): string {
  return (value || "")
    .toLocaleLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getKeywords(value?: string | null): Set<string> {
  return new Set(
    normalize(value)
      .split(" ")
      .filter(
        (word) => word.length > 1 && !STOP_WORDS.has(word)
      )
  );
}

function getKeywordSimilarity(
  first: Set<string>,
  second: Set<string>
): number {
  if (first.size === 0 || second.size === 0) return 0;

  let common = 0;

  for (const word of first) {
    if (second.has(word)) common++;
  }

  return (2 * common) / (first.size + second.size);
}

function calculateMatch(item: Item, need: Need) {
  let score = 0;
  const reasons: string[] = [];

  // Category: 40 points
  const itemCategory = normalize(item.category);
  const needCategory = normalize(need.category);

  if (
    itemCategory &&
    needCategory &&
    itemCategory === needCategory
  ) {
    score += 40;
    reasons.push("Same category");
  }

  // Title similarity: up to 25 points
  const itemTitle = getKeywords(item.title);
  const needTitle = getKeywords(need.title);

  const titleSimilarity = getKeywordSimilarity(
    itemTitle,
    needTitle
  );

  const titlePoints = Math.round(25 * titleSimilarity);

  if (titlePoints > 0) {
    score += titlePoints;
    reasons.push("Similar title keywords");
  }

  // Description similarity: up to 10 points
  const itemDescription = getKeywords(item.description);
  const needDescription = getKeywords(need.description);

  const descriptionSimilarity = getKeywordSimilarity(
    itemDescription,
    needDescription
  );

  const descriptionPoints = Math.round(
    10 * descriptionSimilarity
  );

  if (descriptionPoints > 0) {
    score += descriptionPoints;
    reasons.push("Related descriptions");
  }

  // Same city: 15 points
  const itemCity = normalize(item.city);
  const needCity = normalize(need.city);

  const sameCity =
    itemCity !== "" &&
    needCity !== "" &&
    itemCity === needCity;

  if (sameCity) {
    score += 15;
    reasons.push("Same city");
  }

  // Same locality in the same city: 10 points
  const itemLocality = normalize(item.locality);
  const needLocality = normalize(need.locality);

  if (
    sameCity &&
    itemLocality !== "" &&
    needLocality !== "" &&
    itemLocality === needLocality
  ) {
    score += 10;
    reasons.push("Same locality");
  }

  const itemAllKeywords = getKeywords(
    `${item.title} ${item.description || ""}`
  );

  const needAllKeywords = getKeywords(
    `${need.title} ${need.description || ""}`
  );

  const matchedKeywords = [...itemAllKeywords].filter(
    (word) => needAllKeywords.has(word)
  );

  return {
    score: Math.min(100, score),
    matchedKeywords,
    reasons,
  };
}

function getMatchLabel(score: number) {
  if (score >= 70) return "Strong match";
  if (score >= 40) return "Possible match";
  return "Partial match";
}

function getScoreStyle(score: number) {
  if (score >= 70) return "bg-emerald-100 text-emerald-800";
  if (score >= 40) return "bg-amber-100 text-amber-800";
  return "bg-gray-100 text-gray-700";
}

export default function SmartMatchesPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [matches, setMatches] = useState<SmartMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [openingChat, setOpeningChat] = useState<string | null>(null);
  const [minimumScore, setMinimumScore] = useState("25");
  const [locationOnly, setLocationOnly] = useState(false);

  const loadMatches = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw new Error(authError.message);

      if (!user) {
        router.replace("/login");
        return;
      }

      setCurrentUserId(user.id);

      const [itemsResult, needsResult] = await Promise.all([
        supabase
          .from("items")
          .select(
            "id, title, description, category, condition, city, locality, owner_id, created_at"
          )
          .order("created_at", { ascending: false }),

        supabase
          .from("needs")
          .select(
            "id, title, description, category, city, locality, user_id, created_at"
          )
          .order("created_at", { ascending: false }),
      ]);

      if (itemsResult.error) {
        throw new Error(
          `Items could not be loaded: ${itemsResult.error.message}`
        );
      }

      if (needsResult.error) {
        throw new Error(
          `Needs could not be loaded: ${needsResult.error.message}`
        );
      }

      const items = (itemsResult.data || []) as Item[];
      const needs = (needsResult.data || []) as Need[];
      const generatedMatches: SmartMatch[] = [];

      for (const item of items) {
        for (const need of needs) {
          // Do not match a user's item to their own need.
          if (item.owner_id === need.user_id) continue;

          const involvesCurrentUser =
            item.owner_id === user.id ||
            need.user_id === user.id;

          if (!involvesCurrentUser) continue;

          const result = calculateMatch(item, need);

          if (result.score < MINIMUM_MATCH_SCORE) continue;

          if (locationOnly) {
            const itemCity = normalize(item.city);
            const needCity = normalize(need.city);

            if (
              !itemCity ||
              !needCity ||
              itemCity !== needCity
            ) {
              continue;
            }
          }

          generatedMatches.push({
            id: `${item.id}-${need.id}`,
            item,
            need,
            score: result.score,
            matchedKeywords: result.matchedKeywords,
            reasons: result.reasons,
            otherUserId:
              item.owner_id === user.id
                ? need.user_id
                : item.owner_id,
          });
        }
      }

      generatedMatches.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;

        const dateA = Math.max(
          Date.parse(a.item.created_at) || 0,
          Date.parse(a.need.created_at) || 0
        );

        const dateB = Math.max(
          Date.parse(b.item.created_at) || 0,
          Date.parse(b.need.created_at) || 0
        );

        return dateB - dateA;
      });

      setMatches(generatedMatches);
    } catch (err) {
      console.error("Smart matching error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to calculate matches."
      );
    } finally {
      setLoading(false);
    }
  }, [supabase, router, locationOnly]);

  useEffect(() => {
    void loadMatches();
  }, [loadMatches]);

  async function openMatchChat(match: SmartMatch) {
    if (!currentUserId || openingChat !== null) return;

    setOpeningChat(match.id);
    setError("");

    try {
      const { data: existing, error: lookupError } =
        await supabase
          .from("conversations")
          .select("id")
          .eq("item_id", match.item.id)
          .eq("need_id", match.need.id)
          .limit(1);

      if (lookupError) throw lookupError;

      if (existing && existing.length > 0) {
        router.push(`/chat/${existing[0].id}`);
        return;
      }

      const { data: created, error: createError } =
        await supabase
          .from("conversations")
          .insert({
            item_id: match.item.id,
            need_id: match.need.id,
            owner_id: match.item.owner_id,
            interested_user_id: match.need.user_id,
          })
          .select("id")
          .single();

      if (createError) throw createError;
      if (!created?.id) {
        throw new Error("Conversation ID was not returned.");
      }

      router.push(`/chat/${created.id}`);
    } catch (err) {
      console.error("Unable to open match chat:", err);

      setError(
        err instanceof Error
          ? `Could not open chat: ${err.message}`
          : "Could not open chat. Please try again."
      );
    } finally {
      setOpeningChat(null);
    }
  }

  const visibleMatches = matches.filter(
    (match) => match.score >= Number(minimumScore)
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f4]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[#173d29]" />
          <p className="mt-4 font-semibold text-[#173d29]">
            Finding your best matches...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8f4] text-[#173d29]">
      <header className="border-b border-[#e5e2da] bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-5">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex h-10 w-10 items-center justify-center rounded-full text-2xl hover:bg-[#f1eee6]"
            aria-label="Back to dashboard"
          >
            ←
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[#c63868]">
              KAAM KA SATHI
            </p>
            <h1 className="text-2xl font-black sm:text-3xl">
              Smart Matches
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Connect available items with real community needs.
            </p>
          </div>

          <button
            onClick={() => void loadMatches()}
            disabled={loading}
            className="rounded-xl border border-[#dedbd2] px-3 py-2 text-sm font-bold hover:bg-[#f7f8f4] disabled:opacity-60 sm:px-4"
          >
            ↻ Refresh
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
        <div className="mb-6 rounded-3xl bg-[#173d29] p-6 text-white sm:p-8">
          <p className="text-sm font-bold text-[#f7c5d6]">
            GIVE • REUSE • CONNECT
          </p>
          <h2 className="mt-2 text-2xl font-black sm:text-3xl">
            The right item for the right person.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80">
            Discover suggestions based on category, title,
            description and location. Review match reasons
            and connect when you find a useful match.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <div className="rounded-xl bg-white/10 px-4 py-3">
              <p className="text-2xl font-black">{matches.length}</p>
              <p className="text-xs text-white/75">Potential matches</p>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-3">
              <p className="text-2xl font-black">
                {visibleMatches.length}
              </p>
              <p className="text-xs text-white/75">
                Currently displayed
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-[#e5e2da] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <label
              htmlFor="minimum-score"
              className="block text-sm font-bold"
            >
              Minimum match score
            </label>
            <select
              id="minimum-score"
              value={minimumScore}
              onChange={(event) =>
                setMinimumScore(event.target.value)
              }
              className="mt-2 rounded-xl border border-[#dedbd2] bg-white px-3 py-2 text-sm outline-none focus:border-[#173d29]"
            >
              <option value="25">25% and above</option>
              <option value="40">40% and above</option>
              <option value="60">60% and above</option>
              <option value="80">80% and above</option>
            </select>
          </div>

          <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={locationOnly}
              onChange={(event) =>
                setLocationOnly(event.target.checked)
              }
              className="h-4 w-4 accent-[#173d29]"
            />
            Same-city matches only
          </label>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <p className="font-bold">Something needs attention</p>
            <p className="mt-1 break-words">{error}</p>
            <button
              onClick={() => void loadMatches()}
              className="mt-3 font-bold underline"
            >
              Reload matches
            </button>
          </div>
        )}

        {!error && visibleMatches.length === 0 && (
          <div className="rounded-3xl border border-[#e5e2da] bg-white px-6 py-14 text-center">
            <div className="text-5xl">🔎</div>
            <h2 className="mt-4 text-xl font-black">
              No matches found yet
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-500">
              Add an item or post a community need with a clear
              title, category, description and location. Relevant
              suggestions will appear when matching listings exist.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                onClick={() => router.push("/items/new")}
                className="rounded-xl bg-[#173d29] px-5 py-3 font-bold text-white hover:bg-[#24573b]"
              >
                + List an Item
              </button>
              <button
                onClick={() => router.push("/needs/new")}
                className="rounded-xl border border-[#dedbd2] px-5 py-3 font-bold hover:bg-[#f7f8f4]"
              >
                + Post a Need
              </button>
            </div>
          </div>
        )}

        {visibleMatches.length > 0 && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {visibleMatches.map((match) => {
              const myItem =
                match.item.owner_id === currentUserId;

              return (
                <article
                  key={match.id}
                  className="overflow-hidden rounded-3xl border border-[#e5e2da] bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-[#eeeae2] px-5 py-4">
                    <span className="text-sm font-bold">
                      {myItem
                        ? "Your item matches a need"
                        : "An item matches your need"}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-black ${getScoreStyle(
                        match.score
                      )}`}
                    >
                      {match.score}% match
                    </span>
                  </div>

                  <div className="px-5 pt-4">
                    <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                      <span>{getMatchLabel(match.score)}</span>
                      <span>{match.score}/100</span>
                    </div>
                    <div
                      className="h-2 overflow-hidden rounded-full bg-gray-100"
                      role="progressbar"
                      aria-label="Match score"
                      aria-valuenow={match.score}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full rounded-full bg-[#c63868] transition-all"
                        style={{ width: `${match.score}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5">
                    <div className="rounded-2xl bg-[#f7f8f4] p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                        Available item
                      </p>
                      <h3 className="mt-2 break-words font-black">
                        {match.item.title}
                      </h3>
                      <p className="mt-2 text-xs text-gray-500">
                        {match.item.category}
                        {match.item.condition
                          ? ` • ${match.item.condition}`
                          : ""}
                      </p>
                      {match.item.description && (
                        <p className="mt-3 line-clamp-3 break-words text-sm leading-5 text-gray-600">
                          {match.item.description}
                        </p>
                      )}
                      <p className="mt-3 break-words text-xs text-gray-500">
                        📍{" "}
                        {[
                          match.item.locality,
                          match.item.city,
                        ]
                          .filter(Boolean)
                          .join(", ") || "Location not specified"}
                      </p>
                      {myItem && (
                        <span className="mt-3 inline-block rounded-full bg-[#dcefe2] px-2.5 py-1 text-xs font-bold text-[#24573b]">
                          Your listing
                        </span>
                      )}
                    </div>

                    <div className="rounded-2xl bg-[#fff5f8] p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#c63868]">
                        Community need
                      </p>
                      <h3 className="mt-2 break-words font-black">
                        {match.need.title}
                      </h3>
                      <p className="mt-2 text-xs text-gray-500">
                        {match.need.category}
                      </p>
                      {match.need.description && (
                        <p className="mt-3 line-clamp-3 break-words text-sm leading-5 text-gray-600">
                          {match.need.description}
                        </p>
                      )}
                      <p className="mt-3 break-words text-xs text-gray-500">
                        📍{" "}
                        {[
                          match.need.locality,
                          match.need.city,
                        ]
                          .filter(Boolean)
                          .join(", ") || "Location not specified"}
                      </p>
                      {!myItem && (
                        <span className="mt-3 inline-block rounded-full bg-[#f8dce6] px-2.5 py-1 text-xs font-bold text-[#a92e57]">
                          Your need
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="px-5 pb-4">
                    <p className="text-xs font-bold text-gray-500">
                      WHY THIS MATCH?
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {match.reasons.map((reason) => (
                        <span
                          key={reason}
                          className="rounded-full border border-[#e5e2da] px-2.5 py-1 text-xs text-[#173d29]"
                        >
                          ✓ {reason}
                        </span>
                      ))}
                      {match.matchedKeywords.length > 0 && (
                        <span className="rounded-full border border-[#e5e2da] px-2.5 py-1 text-xs text-gray-600">
                          Shared keywords:{" "}
                          {match.matchedKeywords
                            .slice(0, 5)
                            .join(", ")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-[#eeeae2] p-4 sm:px-5">
                    <button
                      onClick={() => void openMatchChat(match)}
                      disabled={openingChat !== null}
                      className="w-full rounded-xl bg-[#c63868] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#a92e57] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {openingChat === match.id
                        ? "Opening chat..."
                        : openingChat !== null
                          ? "Please wait..."
                          : "💬 Connect"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
