import { useState } from "react";
import { ChevronDownIcon, FileTextIcon, ShieldCheckIcon, ScaleIcon } from "lucide-react";

export function LegalSettings() {
  const [openSection, setOpenSection] = useState<string | null>("privacy");

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <section className="settings-detail-section" aria-labelledby="settings-legal-title">
      <header>
        <p className="type-group-label">Telkar Vault</p>
        <h2 id="settings-legal-title">Legal & Privacy</h2>
        <p>Policies regarding your data, privacy, and our terms of service.</p>
      </header>

      <div className="apple-grouped-list">
        {/* Privacy Policy */}
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => toggleSection("privacy")}
            className="settings-group settings-control-row w-full text-left bg-transparent border-0 cursor-pointer system-interactive select-none"
          >
            <span className="settings-row-icon"><ShieldCheckIcon aria-hidden="true" /></span>
            <span>
              <strong>Privacy Policy</strong>
              <small>DPDP, GDPR & CCPA Compliance</small>
            </span>
            <div className="flex justify-end">
              <ChevronDownIcon className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${openSection === "privacy" ? "rotate-180" : ""}`} />
            </div>
          </button>
          
          {openSection === "privacy" && (
            <div className="p-4 px-5 text-[14px] text-muted-foreground leading-relaxed space-y-4 border-t border-border/40 bg-secondary/10">
              <p><strong>Effective Date:</strong> January 1, 2026</p>
              <p>At Telkar Vault, your privacy is our highest priority. We are committed to complying with global and regional data protection laws, including the <strong>India Digital Personal Data Protection (DPDP) Act, 2023</strong>, the <strong>General Data Protection Regulation (GDPR)</strong>, and the <strong>California Consumer Privacy Act (CCPA)</strong>.</p>
              
              <h3 className="text-foreground font-semibold text-[15px] mt-4 mb-2">Zero-Knowledge Architecture</h3>
              <p>Telkar Vault operates on a strict zero-knowledge architecture. This means your vault data (passwords, secure notes, bank details) is encrypted and decrypted locally on your device using your Master Password. We never receive, store, or have the ability to view your Master Password or the unencrypted contents of your vault.</p>

              <h3 className="text-foreground font-semibold text-[15px] mt-4 mb-2">Data We Collect</h3>
              <p>Due to our zero-knowledge architecture, the personal data we process is strictly limited to what is necessary to provide the service:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Your email address (for account identification and communication).</li>
                <li>Encrypted vault blobs (which we cannot decrypt or read).</li>
                <li>Basic analytics and diagnostic data (anonymized, to improve service reliability).</li>
              </ul>

              <h3 className="text-foreground font-semibold text-[15px] mt-4 mb-2">Your Rights (DPDP, GDPR, CCPA)</h3>
              <p>Depending on your jurisdiction, you have the following rights regarding your personal data:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Right to Access & Portability:</strong> You can export your entire vault data at any time from the "Data & Backup" settings.</li>
                <li><strong>Right to Erasure (Right to be Forgotten):</strong> You can permanently delete your account and all associated encrypted data from the "Danger Zone" settings. Once deleted, this data cannot be recovered.</li>
                <li><strong>Right to Correction:</strong> You can update your account information (like your email address) directly within the app.</li>
                <li><strong>Right of Nomination (DPDP):</strong> You have the right to nominate an individual to act on your behalf in the event of death or incapacity (handled via external support request).</li>
              </ul>

              <p className="text-xs pt-4 border-t border-border/30 mt-4">
                If you have questions about our privacy practices, please contact our Data Protection Officer at privacy@telkar.com.
              </p>
            </div>
          )}
        </div>

        {/* Terms of Service */}
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => toggleSection("terms")}
            className="settings-group settings-control-row w-full text-left bg-transparent border-0 cursor-pointer system-interactive select-none"
          >
            <span className="settings-row-icon"><FileTextIcon aria-hidden="true" /></span>
            <span>
              <strong>Terms of Service</strong>
              <small>Usage rules and limitations</small>
            </span>
            <div className="flex justify-end">
              <ChevronDownIcon className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${openSection === "terms" ? "rotate-180" : ""}`} />
            </div>
          </button>
          
          {openSection === "terms" && (
            <div className="p-4 px-5 text-[14px] text-muted-foreground leading-relaxed space-y-4 border-t border-border/40 bg-secondary/10">
              <p><strong>Effective Date:</strong> January 1, 2026</p>
              <p>Welcome to Telkar Vault. By using our application, you agree to these Terms of Service. Please read them carefully.</p>
              
              <h3 className="text-foreground font-semibold text-[15px] mt-4 mb-2">1. Use of Service</h3>
              <p>You agree to use Telkar Vault only for lawful purposes. You are responsible for maintaining the confidentiality of your Master Password. Because we use a zero-knowledge architecture, <strong>we cannot recover your data if you lose your Master Password.</strong></p>

              <h3 className="text-foreground font-semibold text-[15px] mt-4 mb-2">2. Acceptable Use</h3>
              <p>You must not use our service to store illegal content, distribute malware, or engage in activities that compromise the security and availability of the service.</p>

              <h3 className="text-foreground font-semibold text-[15px] mt-4 mb-2">3. Limitation of Liability</h3>
              <p>Telkar Vault is provided "as is" without warranties of any kind. We are not liable for data loss resulting from forgotten Master Passwords, compromised devices, or user error.</p>

              <h3 className="text-foreground font-semibold text-[15px] mt-4 mb-2">4. Termination</h3>
              <p>We reserve the right to suspend or terminate your account if you violate these Terms. You may terminate your account at any time by using the "Delete Account" feature.</p>
            </div>
          )}
        </div>

        {/* Security & Architecture */}
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => toggleSection("security")}
            className="settings-group settings-control-row w-full text-left bg-transparent border-0 cursor-pointer system-interactive select-none"
          >
            <span className="settings-row-icon"><ScaleIcon aria-hidden="true" /></span>
            <span>
              <strong>Security Architecture</strong>
              <small>Encryption and technical standards</small>
            </span>
            <div className="flex justify-end">
              <ChevronDownIcon className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${openSection === "security" ? "rotate-180" : ""}`} />
            </div>
          </button>
          
          {openSection === "security" && (
            <div className="p-4 px-5 text-[14px] text-muted-foreground leading-relaxed space-y-4 border-t border-border/40 bg-secondary/10">
              <p>Our security model ensures that you are the only one who holds the keys to your data.</p>
              
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Client-Side Encryption:</strong> All encryption and decryption happen locally on your device.</li>
                <li><strong>Encryption Standards:</strong> We use industry-standard AES-256-GCM encryption for all vault items.</li>
                <li><strong>Key Derivation:</strong> Your encryption key is derived from your Master Password using PBKDF2 (or Argon2) with a high iteration count and a unique cryptographic salt.</li>
                <li><strong>Secure Communication:</strong> All data transmitted between your device and our servers is secured using TLS 1.3.</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
