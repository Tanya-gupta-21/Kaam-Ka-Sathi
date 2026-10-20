"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type Need = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  city: string | null;
  locality: string | null;
  created_at: string;
};

type Profile = {
  id: string;
  full_name: string | null;
};

export default function NeedsPage() {
  const supabase = createClient();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [profiles, setProfiles] = useState<
    Record<string, Profile>
  >({});
  const [helpedNeeds, setHelpedNeeds] = useState<
    Set<string>
  >(new Set());

  const [loading, setLoading] = useState(true);
  const [helpingId, setHelpingId] = useState<string | null>(
    null
  );

  // -----------------------------
  // Load user + needs
  // -----------------------------
  useEffect(() => {
    async function loadData() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);

      // Fetch community needs
      const { data: needsData, error: needsError } =
        await supabase
          .from("needs")
          .select(
            "id, user_id, title, description, category, city, locality, created_at"
          )
          .neq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          });

      if (needsError) {
        console.error(
          "Needs loading error:",
          needsError
        );
      } else {
        setNeeds(needsData || []);
      }

      // Fetch profiles
      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles_public")
          .select("id, full_name");

      if (profileError) {
        console.error(
          "Profiles loading error:",
          profileError
        );
      } else {
        const profileMap: Record<string, Profile> = {};

        (profileData || []).forEach((profile) => {
          profileMap[profile.id] = profile;
        });

        setProfiles(profileMap);
      }

      // Fetch user's previous help offers
      const { data: interestsData, error: interestsError } =
        await supabase
          .from("need_interests")
          .select("need_id")
          .eq("interested_user_id", user.id);

      if (interestsError) {
        console.error(
          "Help offers loading error:",
          interestsError
        );
      } else {
        setHelpedNeeds(
          new Set(
            (interestsData || []).map(
              (item) => item.need_id
            )
          )
        );
      }

      setLoading(false);
    }

    loadData();
  }, []);

  // -----------------------------
  // I CAN HELP
  // -----------------------------
  async function handleHelp(need: Need) {
    if (!user) {
      router.push("/login");
      return;
    }

    if (helpingId) return;

    setHelpingId(need.id);

    try {
      // --------------------------------
      // 1. Add help interest if missing
      // --------------------------------
      const { data: existingInterest, error: interestCheckError } =
        await supabase
          .from("need_interests")
          .select("id")
          .eq("need_id", need.id)
          .eq("interested_user_id", user.id)
          .maybeSingle();

      if (interestCheckError) {
        console.error(
          "Interest check error:",
          interestCheckError
        );
      }

      if (!existingInterest) {
        const { error: interestInsertError } =
          await supabase
            .from("need_interests")
            .insert({
              need_id: need.id,
              interested_user_id: user.id,
            });

        if (interestInsertError) {
          console.error(
            "Interest insert error:",
            interestInsertError
          );

          alert("Unable to send help request.");
          return;
        }
      }

      // --------------------------------
      // 2. Check existing conversation
      // --------------------------------
      const { data: existingConversation, error: conversationCheckError } =
        await supabase
          .from("conversations")
          .select("id")
          .eq("need_id", need.id)
          .eq("interested_user_id", user.id)
          .maybeSingle();

      if (conversationCheckError) {
        console.error(
          "Conversation check error:",
          conversationCheckError
        );
      }

      let conversationId =
        existingConversation?.id;

      // --------------------------------
      // 3. Create conversation
      // --------------------------------
      if (!conversationId) {
        const { data: newConversation, error: conversationError } =
          await supabase
            .from("conversations")
            .insert({
              need_id: need.id,
              owner_id: need.user_id,
              interested_user_id: user.id,
            })
            .select("id")
            .single();

        if (conversationError) {
          console.error(
            "Conversation creation error:",
            conversationError
          );

          alert(
            "Unable to start chat. Please try again."
          );

          return;
        }

        conversationId = newConversation.id;
      }

      // --------------------------------
      // 4. Mark as helped
      // --------------------------------
      setHelpedNeeds((previous) => {
        const updated = new Set(previous);
        updated.add(need.id);
        return updated;
      });

      // --------------------------------
      // 5. Open chat directly
      // --------------------------------
      router.push(`/chat/${conversationId}`);
    } catch (error) {
      console.error("Help error:", error);
      alert("Something went wrong.");
    } finally {
      setHelpingId(null);
    }
  }

  // -----------------------------
  // Loading
  // -----------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8f4] flex items-center justify-center">
        <div className="text-[#173d29] font-semibold text-lg">
          Loading community needs...
        </div>
      </div>
    );
  }

  // -----------------------------
  // Page
  // -----------------------------
  return (
    <div className="min-h-screen bg-[#f7f8f4]">
      {/* Header */}
      <header className="bg-[#173d29] text-white px-6 py-5 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Community Needs
            </h1>

            <p className="text-white/75 mt-1 text-sm">
              Help someone in your community 🤝
            </p>
          </div>

          <button
            onClick={() =>
              router.push("/dashboard")
            }
            className="bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-lg text-sm font-medium"
          >
            Dashboard
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-5 py-8">
        {/* Top section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7">
          <div>
            <h2 className="text-xl font-bold text-[#173d29]">
              People who need something
            </h2>

            <p className="text-gray-500 text-sm mt-1">
              If you have what they need, offer your help.
            </p>
          </div>

          <button
            onClick={() =>
              router.push("/needs/new")
            }
            className="bg-[#c63868] hover:bg-[#ad2f59] text-white px-5 py-3 rounded-xl font-semibold shadow-sm"
          >
            + Post a Need
          </button>
        </div>

        {/* Empty state */}
        {needs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            <div className="text-5xl mb-4">
              🤝
            </div>

            <h3 className="text-xl font-bold text-[#173d29]">
              No community needs yet
            </h3>

            <p className="text-gray-500 mt-2">
              Be the first person to post a need.
            </p>

            <button
              onClick={() =>
                router.push("/needs/new")
              }
              className="mt-5 bg-[#c63868] text-white px-5 py-3 rounded-xl font-semibold"
            >
              Post a Need
            </button>
          </div>
        ) : (
          /* Needs grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {needs.map((need) => {
              const profile =
                profiles[need.user_id];

              const alreadyHelped =
                helpedNeeds.has(need.id);

              const isHelping =
                helpingId === need.id;

              return (
                <div
                  key={need.id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition overflow-hidden"
                >
                  {/* Card top */}
                  <div className="p-5">
                    {/* Category */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="inline-flex px-3 py-1 rounded-full bg-[#eef5ef] text-[#173d29] text-xs font-semibold">
                        {need.category}
                      </span>

                      <span className="text-xs text-gray-400">
                        {new Date(
                          need.created_at
                        ).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-900">
                      {need.title}
                    </h3>

                    {/* Description */}
                    {need.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                        {need.description}
                      </p>
                    )}

                    {/* Location */}
                    {(need.city ||
                      need.locality) && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-4">
                        <span>📍</span>

                        <span>
                          {[
                            need.locality,
                            need.city,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </div>
                    )}

                    {/* Posted by */}
                    <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100">
                      <div className="w-9 h-9 rounded-full bg-[#173d29] text-white flex items-center justify-center font-semibold text-sm">
                        {profile?.full_name
                          ?.charAt(0)
                          .toUpperCase() || "U"}
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {profile?.full_name ||
                            "Community User"}
                        </p>

                        <p className="text-xs text-gray-400">
                          Needs help
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="px-5 pb-5">
                    <button
                      onClick={() =>
                        handleHelp(need)
                      }
                      disabled={isHelping}
                      className={`w-full py-3 rounded-xl font-semibold transition ${
                        alreadyHelped
                          ? "bg-[#173d29] text-white hover:bg-[#123020]"
                          : "bg-[#c63868] text-white hover:bg-[#ad2f59]"
                      } disabled:opacity-60`}
                    >
                      {isHelping
                        ? "Opening chat..."
                        : alreadyHelped
                        ? "💬 Open Chat"
                        : "🤝 I Can Help"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
