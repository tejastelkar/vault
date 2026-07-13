import Papa from "papaparse";
import { createImportDraft } from "@/lib/import/normalize";
import type { ImportDraft } from "@/lib/import/types";

type CsvRow = Record<string, string>;
const aliases = {
  title: ["title", "name"], domain: ["url", "website", "origin"], username: ["username", "login_username", "login"], password: ["password", "login_password"],
  content: ["content", "note", "notes"], account: ["account", "account_number"], routing: ["routing", "routing_number", "ifsc", "swift"],
  number: ["number", "card_number"], expiry: ["expiry", "expiration"], cvv: ["cvv", "cvc"], holder: ["holder", "cardholder", "account_holder"],
};

function normalizedRow(row: CsvRow) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.trim().toLowerCase(), String(value ?? "").trim()]));
}

function pick(row: CsvRow, keys: string[]) {
  for (const key of keys) if (row[key]) return row[key];
  return "";
}

export async function parseImportCsv(file: File, mode: "csv" | "browser_csv"): Promise<{ drafts: ImportDraft[]; errors: string[] }> {
  const parsed = Papa.parse<CsvRow>(await file.text(), { header: true, skipEmptyLines: "greedy", transformHeader: (header) => header.trim().toLowerCase() });
  const errors = parsed.errors.map((error) => `Row ${(error.row ?? 0) + 2}: ${error.message}`);
  const drafts = parsed.data.map(normalizedRow).map((row, index) => {
    const source = `${file.name} · row ${index + 2}`;
    const title = pick(row, aliases.title) || pick(row, aliases.domain) || `Imported item ${index + 1}`;
    if (mode === "browser_csv" || pick(row, aliases.password) || pick(row, aliases.username)) {
      return createImportDraft("password", title, { domain: pick(row, aliases.domain), username: pick(row, aliases.username), password: pick(row, aliases.password), notes: pick(row, aliases.content), category: "Imported" }, source);
    }
    if (pick(row, aliases.number) || pick(row, aliases.expiry)) {
      return createImportDraft("card", title, { number: pick(row, aliases.number), expiry: pick(row, aliases.expiry), cvv: pick(row, aliases.cvv), name: pick(row, aliases.holder), pin: "", upi_pin: "", extra_details: pick(row, aliases.content) }, source);
    }
    if (pick(row, aliases.account) || pick(row, aliases.routing)) {
      return createImportDraft("bank_account", title, { account: pick(row, aliases.account), routing: pick(row, aliases.routing), name: pick(row, aliases.holder), extra_details: pick(row, aliases.content) }, source);
    }
    return createImportDraft("note", title, { content: pick(row, aliases.content), category: "Imported" }, source);
  });
  return { drafts, errors };
}
