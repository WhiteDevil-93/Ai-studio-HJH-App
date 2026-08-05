import aliasFile from './entryAliases.json';

// Entry IDs removed during deduplication, mapped to the surviving canonical
// entry. Saved favourites and recently-viewed lists are migrated through this
// map on load so a clinician's saved item never silently disappears when a
// duplicate file is retired. Regenerate with scripts/dedupe-entries.mjs.

export const ENTRY_ALIASES: Readonly<Record<string, string>> = aliasFile.aliases;

export function resolveEntryAlias(entryId: string): string {
  return ENTRY_ALIASES[entryId] ?? entryId;
}
