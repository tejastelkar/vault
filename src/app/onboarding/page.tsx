import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/auth/OnboardingForm";
import { AuthorizationError, getMembershipForUser, requireUser } from "@/lib/server/access";
import styles from "./onboarding.module.css";

export const metadata: Metadata = {
  title: "Create your private access — Telkar Vault",
  description: "Complete your Telkar Vault invitation.",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  let user;
  try {
    user = await requireUser();
  } catch (error) {
    if (error instanceof AuthorizationError && error.code === "UNAUTHENTICATED") {
      redirect("/login?next=/vault");
    }
    throw error;
  }

  const membership = await getMembershipForUser(user.id);
  if (membership?.status === "active") redirect("/vault");
  if (membership?.status !== "invited") redirect("/request-access?state=not-approved");

  return (
    <main className={styles.page}>
      <section className={styles.onboardingStage} aria-labelledby="onboarding-title">
        <header className={styles.onboardingIntro}>
          <span className={styles.brandMark} aria-hidden="true"><i /><i /><i /><i /><b /></span>
          <p className={styles.eyebrow}>Private setup · 02</p>
          <h1 id="onboarding-title">Two secrets.<br />Two separate jobs.</h1>
          <p className={styles.lede}>
            Your sign-in password protects this account. Your existing master key decrypts your vault only in this browser and is never sent to us.
          </p>
          <dl className={styles.keyGuide}>
            <div><dt>Sign-in password</dt><dd>Stored by authentication</dd></div>
            <div><dt>Vault master key</dt><dd>Held in local memory only</dd></div>
          </dl>
        </header>
        <div className={styles.formCard}>
          <div className={styles.formHeader}><span>Complete invitation</span><span>02 / 02</span></div>
          <OnboardingForm userId={user.id} email={user.email ?? "your invited email"} />
        </div>
      </section>
    </main>
  );
}
