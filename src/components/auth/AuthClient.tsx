"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadLocalProfile } from "@/lib/storage/profileStorage";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { upsertProfileForUser } from "@/lib/supabase/profile";

export function AuthClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(
    isSupabaseConfigured()
      ? "Sign in or create an account."
      : "Supabase is not configured yet. Add values to .env.local to enable auth.",
  );
  const [isBusy, setIsBusy] = useState(false);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setCurrentEmail(data.user?.email ?? null);
    });
  }, []);

  const submit = async (mode: "sign-in" | "sign-up") => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setMessage("Supabase env vars are missing. Local play still works.");
      return;
    }

    setIsBusy(true);
    const result =
      mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setIsBusy(false);
    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (result.data.user) {
      await upsertProfileForUser(result.data.user, loadLocalProfile());
      setCurrentEmail(result.data.user.email ?? null);
    }

    setMessage(
      mode === "sign-in"
        ? "Signed in. Profile synced with Supabase."
        : "Account created. If email confirmation is disabled, you are ready to play.",
    );
  };

  const signOut = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    setCurrentEmail(null);
    setMessage("Signed out.");
  };

  return (
    <main className="min-h-screen bg-linen text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10">
        <div className="rounded-lg border border-white/60 bg-white/70 p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">
            Account
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Mahjong Focus Sign In</h1>
          <p className="mt-2 text-sm leading-6 text-ink/70">{message}</p>
          {currentEmail && (
            <p className="mt-3 rounded-md bg-sage/60 px-3 py-2 text-sm font-semibold">
              Active account: {currentEmail}
            </p>
          )}

          <label className="mt-5 block text-sm font-medium text-ink/70">
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              className="mt-1 h-10 w-full rounded-md border border-sage bg-white px-3 text-sm outline-none focus:border-clay"
            />
          </label>
          <label className="mt-3 block text-sm font-medium text-ink/70">
            Password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              className="mt-1 h-10 w-full rounded-md border border-sage bg-white px-3 text-sm outline-none focus:border-clay"
            />
          </label>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => submit("sign-in")}
              className="h-10 rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-[#223229] disabled:opacity-50"
            >
              Sign in
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => submit("sign-up")}
              className="h-10 rounded-md border border-sage bg-white px-4 text-sm font-semibold transition hover:border-clay disabled:opacity-50"
            >
              Sign up
            </button>
          </div>
          {currentEmail && (
            <button
              type="button"
              onClick={signOut}
              className="mt-2 h-10 w-full rounded-md border border-sage bg-white px-4 text-sm font-semibold transition hover:border-clay"
            >
              Sign out
            </button>
          )}

          <Link
            href="/game"
            className="mt-4 inline-flex text-sm font-semibold text-clay hover:text-[#9d6342]"
          >
            Back to game
          </Link>
        </div>
      </div>
    </main>
  );
}
