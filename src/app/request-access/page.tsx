import type { Metadata } from "next";
import Link from "next/link";
import { RequestAccessForm } from "@/components/access/RequestAccessForm";
import styles from "./request-access.module.css";

export const metadata: Metadata = {
  title: "Request access — Telkar Vault",
  description: "Request an invitation to Telkar Vault.",
};

export default function RequestAccessPage() {
  return (
    <main className={styles.page}>
      <nav className={styles.nav} aria-label="Request access navigation">
        <Link className={styles.brand} href="/" aria-label="Telkar Vault home">
          <span className={styles.brandMark} aria-hidden="true"><i /><i /><i /><i /><b /></span>
          <span>Telkar Vault</span>
        </Link>
        <Link className={styles.signIn} href="/login">Already invited? Sign in</Link>
      </nav>

      <section className={styles.stage} aria-labelledby="request-access-title">
        <div className={styles.intro}>
          <p className={styles.eyebrow}>Private by invitation</p>
          <h1 id="request-access-title">A considered way in.</h1>
          <p className={styles.lede}>
            Tell us who you are. We review every request before an invitation is sent.
          </p>

          <div className={styles.seal} aria-hidden="true">
            <span className={styles.sealOrbit} />
            <span className={styles.sealOrbitInner} />
            <span className={styles.sealCore}><i /><i /><i /><i /><b /></span>
            <span className={styles.sealLabel}>Invitation request</span>
          </div>
        </div>

        <div className={styles.formPanel}>
          <div className={styles.formHeading}>
            <span>Request access</span>
            <span>01 / 01</span>
          </div>
          <RequestAccessForm />
          <p className={styles.privacyNote}>
            Only your name and email are collected here. Never enter a password or master key.
          </p>
        </div>
      </section>
    </main>
  );
}
