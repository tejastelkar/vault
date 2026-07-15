"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRightIcon, Loader2Icon } from "lucide-react";
import { parseSafeNextPath } from "@/lib/access/validation";
import { supabase } from "@/lib/supabase";
import styles from "./auth-shell.module.css";

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
    <form onSubmit={signIn} className={styles.formStack} noValidate>
      <div className={styles.fieldGroup}>
        <label className={styles.field} htmlFor="sign-in-email">
          <span className={styles.fieldLabel}>Email</span>
            <input
              id="sign-in-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              disabled={loading}
            />
        </label>
        <label className={styles.field} htmlFor="sign-in-password">
          <span className={styles.fieldLabel}>Sign-in password</span>
            <input
              id="sign-in-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              disabled={loading}
            />
          <button type="submit" disabled={loading} className={styles.arrowButton} aria-label="Sign in">
            {loading ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : <ArrowRightIcon aria-hidden="true" />}
          </button>
        </label>
      </div>

      {error && <p role="alert" className={styles.alert}>{error}</p>}
      {resetSent && <p role="status" className={styles.status}>Password reset link sent.</p>}

      <div className={styles.secondaryActions}>
        <button type="button" onClick={resetPassword} disabled={loading} className={styles.secondaryAction}>
          Reset sign-in password
        </button>
      </div>
    </form>
  );
}
