export async function collectPaginated<T>(
  fetchPage: (offset: number, limit: number) => Promise<T[]>,
  pageSize = 1_000,
) {
  if (!Number.isInteger(pageSize) || pageSize < 1) throw new Error("Invalid page size");

  const collected: T[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const page = await fetchPage(offset, pageSize);
    collected.push(...page);
    if (page.length < pageSize) return collected;
  }
}

export function chunkValues<T>(values: T[], chunkSize = 1_000) {
  if (!Number.isInteger(chunkSize) || chunkSize < 1) throw new Error("Invalid chunk size");
  const chunks: T[][] = [];
  for (let offset = 0; offset < values.length; offset += chunkSize) {
    chunks.push(values.slice(offset, offset + chunkSize));
  }
  return chunks;
}
