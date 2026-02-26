"use client";

import { useAuth } from "@/context/auth-context";

export function AuthStatus() {
  const { user, loginWithGoogle, logout, loading } = useAuth();

  if (loading) {
    return <span className="text-xs uppercase tracking-[0.22em] text-zinc-500">Syncing auth...</span>;
  }

  if (!user) {
    return (
      <button
        className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-200 transition hover:bg-cyan-500/20"
        onClick={loginWithGoogle}
      >
        Sign in with Google
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Authenticated</p>
        <p className="text-sm text-zinc-200">{user.displayName ?? user.email ?? "Operator"}</p>
      </div>
      <button
        className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-200 transition hover:bg-white/10"
        onClick={logout}
      >
        Sign out
      </button>
    </div>
  );
}
