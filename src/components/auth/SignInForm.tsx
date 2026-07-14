"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2Icon, ShieldCheckIcon } from "lucide-react";
import { parseSafeNextPath } from "@/lib/access/validation";
import { supabase } from "@/lib/supabase";

export function SignInForm({ nextPath }: { nextPath?: string | null }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const destination = parseSafeNextPath(nextPath);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.replace(destination);
    router.refresh();
  };

  const resetPassword = async () => {
    if (!email) {
      setError("Enter your email first, then reset your sign-in password.");
      return;
    }

    setLoading(true);
    setError(null);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }
    setResetSent(true);
  };

  return (
    <main className="apple-app apple-surface flex min-h-dvh items-center justify-center px-4 py-10">
      <section className="apple-material w-full max-w-md rounded-[28px] p-6 sm:p-8" aria-labelledby="sign-in-title">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-[18px] bg-primary/10 text-primary">
          <ShieldCheckIcon className="h-7 w-7" />
        </div>
        <h1 id="sign-in-title" className="text-[28px] font-semibold tracking-[-0.03em]">Sign in to Telkar Vault</h1>
        <p className="mt-2 text-[14px] leading-6 text-muted-foreground">
          Use your account credentials. Your vault master key is entered separately after access is verified.
        </p>

        <form onSubmit={signIn} className="mt-7 space-y-4">
          <label className="block text-[13px] font-medium">
            <span className="mb-1.5 block">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              disabled={loading}
              className="h-12 w-full rounded-xl border border-border bg-secondary px-4 text-[16px] outline-none focus:border-primary"
            />
          </label>
          <label className="block text-[13px] font-medium">
            <span className="mb-1.5 block">Sign-in password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              disabled={loading}
              className="h-12 w-full rounded-xl border border-border bg-secondary px-4 text-[16px] outline-none focus:border-primary"
            />
          </label>
          {error && <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-[13px] leading-5 text-destructive">{error}</p>}
          {resetSent && <p role="status" className="rounded-xl bg-emerald-500/10 px-3 py-2 text-[13px] leading-5 text-emerald-700 dark:text-emerald-400">Password reset link sent.</p>}
          <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center rounded-xl bg-primary font-semibold text-primary-foreground disabled:opacity-50">
            {loading ? <Loader2Icon className="h-5 w-5 animate-spin" /> : "Sign in"}
          </button>
          <button type="button" onClick={resetPassword} disabled={loading} className="block w-full text-center text-[13px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50">
            Reset sign-in password
          </button>
          <Link href="/request-access" className="block text-center text-[13px] font-medium text-muted-foreground hover:text-foreground">
            Request access
          </Link>
        </form>
      </section>
    </main>
  );
}
