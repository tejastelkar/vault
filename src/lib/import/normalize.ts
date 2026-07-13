import type { Confidence, GlobalImportResult, ImportDraft, ImportItemType } from "@/lib/import/types";
import { withValidation } from "@/lib/import/validation";

function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }

function confidence(fields: Record<string, string>): Record<string, Confidence> {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, value ? "high" : "low"])) as Record<string, Confidence>;
}

export function createImportDraft(type: ImportItemType, title: string, fields: Record<string, string>, sourceLabel: string): ImportDraft {
  return withValidation({
    clientId: crypto.randomUUID(),
    type,
    title: title.trim(),
    fields,
    confidence: confidence(fields),
    included: true,
    sourceLabel,
    issues: [],
    duplicate: null,
    duplicateResolution: "unresolved",
  });
}

export function normalizeImportResult(result: GlobalImportResult, sourceLabel: string): ImportDraft[] {
  return [
    ...result.passwords.map((item) => createImportDraft("password", text(item.title), { domain: text(item.url), username: text(item.username), password: text(item.password), notes: text(item.extra_details), category: text(item.category) || "Uncategorized" }, sourceLabel)),
    ...result.notes.map((item) => createImportDraft("note", text(item.title), { content: text(item.content), category: text(item.category) || "Uncategorized" }, sourceLabel)),
    ...result.bank_accounts.map((item) => createImportDraft("bank_account", text(item.title), { account: text(item.account), routing: text(item.routing), name: text(item.name), extra_details: text(item.extra_details) }, sourceLabel)),
    ...result.credit_cards.map((item) => createImportDraft("card", text(item.title), { number: text(item.number), expiry: text(item.expiry), cvv: text(item.cvv), name: text(item.name), pin: text(item.pin), upi_pin: text(item.upi_pin), extra_details: text(item.extra_details) }, sourceLabel)),
  ];
}

export function isGlobalImportResult(value: unknown): value is GlobalImportResult {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<GlobalImportResult>;
  return [candidate.passwords, candidate.notes, candidate.bank_accounts, candidate.credit_cards].every(Array.isArray);
}
