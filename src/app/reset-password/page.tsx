"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KeyRoundIcon, Loader2Icon, ShieldCheckIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    let active = true;
    const prepare = async () => {
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) await supabase.auth.exchangeCodeForSession(code);
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setReady(Boolean(data.session));
      if (!data.session) setError("This reset link is invalid or has expired. Request a new one from sign in.");
    };
    void prepare();
    return () => { active = false; };
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) { setError("Use at least 8 characters."); return; }
    if (password !== confirmPassword) { setError("The passwords do not match."); return; }
    setWorking(true);
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setWorking(false);
    if (updateError) { setError(updateError.message); return; }
    setComplete(true);
  };

  return (
    <main className="apple-app apple-surface flex min-h-dvh items-center justify-center px-4 py-10">
      <section className="apple-material w-full max-w-md rounded-[28px] p-6 sm:p-8" aria-labelledby="reset-title">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-[18px] bg-primary/10 text-primary">
          {complete ? <ShieldCheckIcon className="h-7 w-7" /> : <KeyRoundIcon className="h-7 w-7" />}
        </div>
        <h1 id="reset-title" className="text-[28px] font-semibold tracking-[-0.03em]">{complete ? "Sign-in password updated" : "Reset sign-in password"}</h1>
        <p className="mt-2 text-[14px] leading-6 text-muted-foreground">
          {complete
            ? "Your account password was changed. Your vault master key was not changed."
            : "This changes only your Supabase sign-in password. You will still need your existing vault master key to decrypt your data."}
        </p>

        {complete ? (
          <Link href="/" className="mt-7 flex h-12 w-full items-center justify-center rounded-xl bg-primary font-semibold text-primary-foreground">Return to Telkar Vault</Link>
        ) : (
          <form onSubmit={submit} className="mt-7 space-y-4">
            <label className="block text-[13px] font-medium"><span className="mb-1.5 block">New sign-in password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" disabled={!ready || working} className="h-12 w-full rounded-xl border border-border bg-secondary px-4 text-[16px] outline-none focus:border-primary" /></label>
            <label className="block text-[13px] font-medium"><span className="mb-1.5 block">Confirm password</span><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" disabled={!ready || working} className="h-12 w-full rounded-xl border border-border bg-secondary px-4 text-[16px] outline-none focus:border-primary" /></label>
            {error && <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-[13px] leading-5 text-destructive">{error}</p>}
            <button type="submit" disabled={!ready || working} className="flex h-12 w-full items-center justify-center rounded-xl bg-primary font-semibold text-primary-foreground disabled:opacity-50">{working ? <Loader2Icon className="h-5 w-5 animate-spin" /> : "Update password"}</button>
            <Link href="/" className="block text-center text-[13px] font-medium text-muted-foreground hover:text-foreground">Back to sign in</Link>
          </form>
        )}
      </section>
    </main>
  );
}
