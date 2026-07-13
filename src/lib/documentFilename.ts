export const MAX_AI_RENAME_BYTES = 6 * 1024 * 1024;

const SUPPORTED_AI_RENAME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

type RenameFileMetadata = Pick<File, "size" | "type">;

export type AiRenameEligibility =
  | { eligible: true }
  | { eligible: false; reason: "unsupported-type" | "too-large" };

function splitFilename(filename: string) {
  const leaf = filename.replaceAll("\\", "/").split("/").pop()?.trim() || "document";
  const lastDot = leaf.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === leaf.length - 1) {
    return { base: leaf, extension: "" };
  }

  return {
    base: leaf.slice(0, lastDot),
    extension: leaf.slice(lastDot + 1).toLowerCase(),
  };
}

function sanitizeFilenamePart(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/[\\/:*?"<>|`']/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[.\s]+|[.\s]+$/g, "")
    .slice(0, 96)
    .trim();
}

export function buildSafeDocumentFilename(suggestion: string, originalFilename: string) {
  const original = splitFilename(originalFilename);
  const safeExtension = original.extension.replace(/[^a-z0-9]/g, "").slice(0, 10);
  const safeOriginalBase = sanitizeFilenamePart(original.base) || "document";

  let suggestedBase = suggestion.trim();
  if (
    (suggestedBase.startsWith('"') && suggestedBase.endsWith('"')) ||
    (suggestedBase.startsWith("'") && suggestedBase.endsWith("'"))
  ) {
    suggestedBase = suggestedBase.slice(1, -1);
  }
  if (safeExtension) {
    suggestedBase = suggestedBase.replace(new RegExp(`\\.${safeExtension}$`, "i"), "");
  }

  const safeBase = sanitizeFilenamePart(suggestedBase) || safeOriginalBase;
  return safeExtension ? `${safeBase}.${safeExtension}` : safeBase;
}

export function getAiRenameEligibility(file: RenameFileMetadata): AiRenameEligibility {
  if (!SUPPORTED_AI_RENAME_TYPES.has(file.type)) {
    return { eligible: false, reason: "unsupported-type" };
  }
  if (file.size > MAX_AI_RENAME_BYTES) {
    return { eligible: false, reason: "too-large" };
  }
  return { eligible: true };
}
