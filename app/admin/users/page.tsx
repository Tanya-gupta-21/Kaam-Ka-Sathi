"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type UserProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [adminId, setAdminId] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setAdminId(user.id);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError || profile?.role !== "admin") {
        router.replace("/dashboard");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .order("full_name", { ascending: true });

      if (error) {
        console.error("Users fetch error:", error);
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error("Admin users error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function changeRole(user: UserProfile) {
    if (user.id === adminId) {
      alert("You cannot change your own admin role.");
      return;
    }

    const newRole = user.role === "admin" ? "user" : "admin";

    const confirmed = window.confirm(
      `Are you sure you want to change ${user.full_name || "this user"}'s role to ${newRole}?`
    );

    if (!confirmed) return;

    try {
      setUpdatingId(user.id);

      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", user.id);

      if (error) {
        console.error("Role update error:", error);
        alert(error.message);
        return;
      }

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === user.id
            ? { ...currentUser, role: newRole }
            : currentUser
        )
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function handleLogout() {
    supabase.auth.signOut().then(() => {
      router.replace("/login");
      router.refresh();
    });
  }

  const filteredUsers = users.filter((user) => {
    const searchText = search.toLowerCase().trim();

    const matchesSearch =
      !searchText ||
      (user.full_name || "").toLowerCase().includes(searchText) ||
      (user.email || "").toLowerCase().includes(searchText);

    const matchesRole =
      roleFilter === "all" || (user.role || "user") === roleFilter;

    return matchesSearch && matchesRole;
  });

  const adminCount = users.filter(
    (user) => user.role === "admin"
  ).length;

  const normalUserCount = users.filter(
    (user) => user.role !== "admin"
  ).length;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f4]">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-[#dfe7df] border-t-[#173d29]" />

          <p className="mt-5 font-semibold text-gray-500">
            Loading users...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8f4] text-[#173d29]">
      <div className="flex min-h-screen">

        {/* SIDEBAR */}

        <aside className="hidden w-72 shrink-0 bg-[#173d29] text-white lg:flex lg:flex-col">

          <div className="border-b border-white/10 px-7 py-7">
            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-2xl">
                ♻️
              </div>

              <div>
                <h1 className="text-lg font-black">
                  Kaam Ka Sathi
                </h1>

                <p className="text-xs text-green-200">
                  Admin Panel
                </p>
              </div>

            </div>
          </div>

          <nav className="flex-1 space-y-2 px-4 py-6">

            <button
              onClick={() => router.push("/admin/dashboard")}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left font-semibold text-green-100 transition hover:bg-white/10 hover:text-white"
            >
              <span>📊</span>
              Dashboard
            </button>

            <button
              className="flex w-full items-center gap-3 rounded-2xl bg-white/10 px-4 py-3.5 text-left font-bold"
            >
              <span>👥</span>
              Users
            </button>

            <button
              onClick={() => router.push("/admin/items")}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left font-semibold text-green-100 transition hover:bg-white/10 hover:text-white"
            >
              <span>📦</span>
              Items
            </button>

            <button
              onClick={() => router.push("/admin/needs")}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left font-semibold text-green-100 transition hover:bg-white/10 hover:text-white"
            >
              <span>🙋</span>
              Community Needs
            </button>

            <button
              onClick={() => router.push("/admin/interests")}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left font-semibold text-green-100 transition hover:bg-white/10 hover:text-white"
            >
              <span>❤️</span>
              Interests
            </button>

            <button
              onClick={() => router.push("/dashboard")}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left font-semibold text-green-100 transition hover:bg-white/10 hover:text-white"
            >
              <span>👤</span>
              User Dashboard
            </button>

          </nav>

          <div className="border-t border-white/10 p-4">

            <div className="mb-3 rounded-2xl bg-white/10 p-4">
              <p className="text-xs text-green-200">
                Logged in as
              </p>

              <p className="mt-1 truncate font-bold">
                Admin
              </p>

              <span className="mt-2 inline-block rounded-full bg-[#c63868] px-3 py-1 text-xs font-bold">
                ADMIN
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-semibold text-red-200 transition hover:bg-red-500/10"
            >
              <span>↪</span>
              Logout
            </button>

          </div>
        </aside>

        {/* MAIN */}

        <section className="min-w-0 flex-1">

          {/* HEADER */}

          <header className="border-b border-black/5 bg-[#f7f8f4] px-5 py-6 md:px-8">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>
                <p className="text-xs font-black tracking-[0.18em] text-[#c63868]">
                  ADMIN PANEL
                </p>

                <h2 className="mt-1 text-3xl font-black">
                  User Management
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Manage registered Kaam Ka Sathi users.
                </p>
              </div>

              <button
                onClick={() => router.push("/admin/dashboard")}
                className="w-fit rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50"
              >
                ← Dashboard
              </button>

            </div>

          </header>

          <div className="p-5 md:p-8">

            {/* STATS */}

            <section className="grid gap-4 sm:grid-cols-3">

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-gray-500">
                  Total Users
                </p>

                <p className="mt-2 text-4xl font-black">
                  {users.length}
                </p>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-gray-500">
                  Admins
                </p>

                <p className="mt-2 text-4xl font-black text-[#c63868]">
                  {adminCount}
                </p>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-gray-500">
                  Normal Users
                </p>

                <p className="mt-2 text-4xl font-black text-[#173d29]">
                  {normalUserCount}
                </p>
              </div>

            </section>

            {/* SEARCH + FILTER */}

            <section className="mt-8 rounded-3xl bg-white p-5 shadow-sm">

              <div className="flex flex-col gap-4 md:flex-row">

                <div className="flex-1">

                  <label className="mb-2 block text-sm font-bold text-gray-600">
                    Search users
                  </label>

                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full rounded-2xl border border-gray-200 bg-[#f7f8f4] px-4 py-3 outline-none transition focus:border-[#173d29]"
                  />

                </div>

                <div className="w-full md:w-52">

                  <label className="mb-2 block text-sm font-bold text-gray-600">
                    Role
                  </label>

                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-[#f7f8f4] px-4 py-3 outline-none"
                  >
                    <option value="all">
                      All users
                    </option>

                    <option value="user">
                      Normal users
                    </option>

                    <option value="admin">
                      Admins
                    </option>
                  </select>

                </div>

              </div>

            </section>

            {/* USERS TABLE */}

            <section className="mt-6 overflow-hidden rounded-3xl bg-white shadow-sm">

              <div className="border-b border-gray-100 px-6 py-5">

                <div className="flex items-center justify-between">

                  <div>
                    <h3 className="text-xl font-black">
                      All Users
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      Showing {filteredUsers.length} of {users.length} users
                    </p>
                  </div>

                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                    {filteredUsers.length} results
                  </span>

                </div>

              </div>

              {filteredUsers.length > 0 ? (

                <div className="overflow-x-auto">

                  <table className="w-full min-w-[750px]">

                    <thead>
                      <tr className="border-b border-gray-100 bg-[#f7f8f4] text-left">

                        <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500">
                          User
                        </th>

                        <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500">
                          Email
                        </th>

                        <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500">
                          Role
                        </th>

                        <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500">
                          Action
                        </th>

                      </tr>
                    </thead>

                    <tbody>

                      {filteredUsers.map((user) => (

                        <tr
                          key={user.id}
                          className="border-b border-gray-100 last:border-0 hover:bg-[#fafbf8]"
                        >

                          {/* USER */}

                          <td className="px-6 py-5">

                            <div className="flex items-center gap-3">

                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#173d29] font-black text-white">
                                {(user.full_name || "U")
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>
                                <p className="font-bold text-[#173d29]">
                                  {user.full_name || "Unknown User"}
                                </p>

                                {user.id === adminId && (
                                  <span className="text-xs font-semibold text-[#c63868]">
                                    You
                                  </span>
                                )}
                              </div>

                            </div>

                          </td>

                          {/* EMAIL */}

                          <td className="px-6 py-5 text-sm text-gray-600">
                            {user.email || "No email"}
                          </td>

                          {/* ROLE */}

                          <td className="px-6 py-5">

                            <span
                              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                                user.role === "admin"
                                  ? "bg-pink-100 text-[#c63868]"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {user.role === "admin"
                                ? "ADMIN"
                                : "USER"}
                            </span>

                          </td>

                          {/* ACTION */}

                          <td className="px-6 py-5">

                            {user.id === adminId ? (

                              <span className="text-xs font-semibold text-gray-400">
                                Current account
                              </span>

                            ) : (

                              <button
                                onClick={() => changeRole(user)}
                                disabled={updatingId === user.id}
                                className="rounded-xl bg-[#173d29] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#23563d] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {updatingId === user.id
                                  ? "Updating..."
                                  : user.role === "admin"
                                  ? "Make User"
                                  : "Make Admin"}
                              </button>

                            )}

                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              ) : (

                <div className="px-6 py-16 text-center">

                  <div className="text-5xl">
                    🔍
                  </div>

                  <h3 className="mt-4 text-xl font-black">
                    No users found
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    Try changing your search or role filter.
                  </p>

                </div>

              )}

            </section>

          </div>

        </section>

      </div>
    </main>
  );
}